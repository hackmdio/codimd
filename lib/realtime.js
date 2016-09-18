//realtime
//external modules
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var url = require('url');
var async = require('async');
var LZString = require('lz-string');
var randomcolor = require("randomcolor");
var Chance = require('chance'),
    chance = new Chance();
var moment = require('moment');

//core
var config = require("./config.js");
var logger = require("./logger.js");
var models = require("./models");

//ot
var ot = require("./ot/index.js");

//public
var realtime = {
    io: null,
    onAuthorizeSuccess: onAuthorizeSuccess,
    onAuthorizeFail: onAuthorizeFail,
    secure: secure,
    connection: connection,
    getStatus: getStatus,
    isReady: isReady
};

function onAuthorizeSuccess(data, accept) {
    accept();
}

function onAuthorizeFail(data, message, error, accept) {
    accept(); //accept whether authorize or not to allow anonymous usage
}

//secure the origin by the cookie
function secure(socket, next) {
    try {
        var handshakeData = socket.request;
        if (handshakeData.headers.cookie) {
            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
            handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie[config.sessionname], config.sessionsecret);
            if (handshakeData.sessionID &&
                handshakeData.cookie[config.sessionname] &&
                handshakeData.cookie[config.sessionname] != handshakeData.sessionID) {
                if (config.debug)
                    logger.info("AUTH success cookie: " + handshakeData.sessionID);
                return next();
            } else {
                next(new Error('AUTH failed: Cookie is invalid.'));
            }
        } else {
            next(new Error('AUTH failed: No cookie transmitted.'));
        }
    } catch (ex) {
        next(new Error("AUTH failed:" + JSON.stringify(ex)));
    }
}

function emitCheck(note) {
    var out = {
        updatetime: note.updatetime,
        lastchangeuser: note.lastchangeuser,
        lastchangeuserprofile: note.lastchangeuserprofile,
        authors: note.authors,
        authorship: note.authorship
    };
    out = LZString.compressToUTF16(JSON.stringify(out));
    realtime.io.to(note.id).emit('check', out);
}

//actions
var users = {};
var notes = {};
//update when the note is dirty
var updater = setInterval(function () {
    async.each(Object.keys(notes), function (key, callback) {
        var note = notes[key];
        if (note.server.isDirty) {
            if (config.debug) logger.info("updater found dirty note: " + key);
            updateNote(note, function(err, _note) {
                // handle when note already been clean up
                if (!notes[key] || !notes[key].server) return callback(null, null);
                if (!_note) {
                    realtime.io.to(note.id).emit('info', {
                        code: 404
                    });
                    logger.error('note not found: ', note.id);
                }
                if (err || !_note) {
                    for (var i = 0, l = note.socks.length; i < l; i++) {
                        var sock = note.socks[i];
                        if (typeof sock !== 'undefined' && sock) {
                            sock.disconnect(true);
                        }
                    }
                    return callback(err, null);
                }
                note.server.isDirty = false;
                note.updatetime = moment(_note.lastchangeAt).valueOf();
                emitCheck(note);
                return callback(null, null);
            });
        } else {
            return callback(null, null);
        }
    }, function (err) {
        if (err) return logger.error('updater error', err);
    });
}, 1000);
function updateNote(note, callback) {
    models.Note.findOne({
        where: {
            id: note.id
        }
    }).then(function (_note) {
        if (!_note) return callback(null, null);
        if (note.lastchangeuser) {
            if (_note.lastchangeuserId != note.lastchangeuser) {
                models.User.findOne({
                    where: {
                        id: note.lastchangeuser
                    }
                }).then(function (user) {
                    if (!user) return callback(null, null);
                    note.lastchangeuserprofile = models.User.parseProfile(user.profile);
                    return finishUpdateNote(note, _note, callback);
                }).catch(function (err) {
                    logger.error(err);
                    return callback(err, null);
                });
            } else {
                return finishUpdateNote(note, _note, callback);
            }
        } else {
            note.lastchangeuserprofile = null;
            return finishUpdateNote(note, _note, callback);
        }
    }).catch(function (err) {
        logger.error(err);
        return callback(err, null);
    });
}
function finishUpdateNote(note, _note, callback) {
    if (!note || !note.server) return callback(null, null);
    var body = note.server.document;
    var title = models.Note.parseNoteTitle(body);
    title = LZString.compressToBase64(title);
    body = LZString.compressToBase64(body);
    var values = {
        title: title,
        content: body,
        authorship: LZString.compressToBase64(JSON.stringify(note.authorship)),
        lastchangeuserId: note.lastchangeuser,
        lastchangeAt: Date.now()
    };
    _note.update(values).then(function (_note) {
        saverSleep = false;
        return callback(null, _note);
    }).catch(function (err) {
        logger.error(err);
        return callback(err, null);
    });
}
//clean when user not in any rooms or user not in connected list
var cleaner = setInterval(function () {
    async.each(Object.keys(users), function (key, callback) {
        var socket = realtime.io.sockets.connected[key];
		if ((!socket && users[key]) ||
			(socket && (!socket.rooms || socket.rooms.length <= 0))) {
            if (config.debug)
                logger.info("cleaner found redundant user: " + key);
			if (!socket) {
				socket = {
					id: key
				};
			}
            disconnectSocketQueue.push(socket);
            disconnect(socket);
        }
        return callback(null, null);
    }, function (err) {
        if (err) return logger.error('cleaner error', err);
    });
}, 60000);
var saverSleep = false;
// save note revision in interval
var saver = setInterval(function () {
    if (saverSleep) return;
    models.Revision.saveAllNotesRevision(function (err, notes) {
        if (err) return logger.error('revision saver failed: ' + err);
        if (notes && notes.length <= 0) {
            saverSleep = true;
            return;
        }
    });
}, 60000 * 5);

function getStatus(callback) {
    models.Note.count().then(function (notecount) {
        var distinctaddresses = [];
        var regaddresses = [];
        var distinctregaddresses = [];
        Object.keys(users).forEach(function (key) {
            var user = users[key];
            var found = false;
            for (var i = 0; i < distinctaddresses.length; i++) {
                if (user.address == distinctaddresses[i]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                distinctaddresses.push(user.address);
            }
            if (user.login) {
                regaddresses.push(user.address);
                var found = false;
                for (var i = 0; i < distinctregaddresses.length; i++) {
                    if (user.address == distinctregaddresses[i]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    distinctregaddresses.push(user.address);
                }
            }
        });
        models.User.count().then(function (regcount) {
            return callback ? callback({
                onlineNotes: Object.keys(notes).length,
                onlineUsers: Object.keys(users).length,
                distinctOnlineUsers: distinctaddresses.length,
                notesCount: notecount,
                registeredUsers: regcount,
                onlineRegisteredUsers: regaddresses.length,
                distinctOnlineRegisteredUsers: distinctregaddresses.length,
                isConnectionBusy: isConnectionBusy,
                connectionSocketQueueLength: connectionSocketQueue.length,
                isDisconnectBusy: isDisconnectBusy,
                disconnectSocketQueueLength: disconnectSocketQueue.length
            }) : null;
        }).catch(function (err) {
            return logger.error('count user failed: ' + err);
        });
    }).catch(function (err) {
        return logger.error('count note failed: ' + err); 
    });
}

function isReady() {
    return realtime.io 
    && Object.keys(notes).length == 0 && Object.keys(users).length == 0 
    && connectionSocketQueue.length == 0 && !isConnectionBusy
    && disconnectSocketQueue.length == 0 && !isDisconnectBusy;
}

function extractNoteIdFromSocket(socket) {
    if (!socket || !socket.handshake || !socket.handshake.headers) {
        return false;
    }
    var referer = socket.handshake.headers.referer;
    if (!referer) {
        return false;
    }
    var hostUrl = url.parse(referer);
    var noteId = config.urlpath ? hostUrl.pathname.slice(config.urlpath.length + 1, hostUrl.pathname.length).split('/')[1] : hostUrl.pathname.split('/')[1];
    return noteId;
}

function parseNoteIdFromSocket(socket, callback) {
    var noteId = extractNoteIdFromSocket(socket);
    if (!noteId) {
        return callback(null, null);
    }
    models.Note.parseNoteId(noteId, function (err, id) {
        if (err || !id) return callback(err, id);
        return callback(null, id);
    });
}

function emitOnlineUsers(socket) {
    var noteId = socket.noteId;
    if (!noteId || !notes[noteId]) return;
    var users = [];
    Object.keys(notes[noteId].users).forEach(function (key) {
        var user = notes[noteId].users[key];
        if (user)
            users.push(buildUserOutData(user));
    });
    var out = {
        users: users
    };
    out = LZString.compressToUTF16(JSON.stringify(out));
    realtime.io.to(noteId).emit('online users', out);
}

function emitUserStatus(socket) {
    var noteId = socket.noteId;
    if (!noteId || !notes[noteId]) return;
    var out = buildUserOutData(users[socket.id]);
    socket.broadcast.to(noteId).emit('user status', out);
}

function emitRefresh(socket) {
    var noteId = socket.noteId;
    if (!noteId || !notes[noteId]) return;
    var note = notes[noteId];
    var out = {
        docmaxlength: config.documentmaxlength,
        owner: note.owner,
        ownerprofile: note.ownerprofile,
        lastchangeuser: note.lastchangeuser,
        lastchangeuserprofile: note.lastchangeuserprofile,
        authors: note.authors,
        authorship: note.authorship,
        permission: note.permission,
        createtime: note.createtime,
        updatetime: note.updatetime
    };
    out = LZString.compressToUTF16(JSON.stringify(out));
    socket.emit('refresh', out);
}

function clearSocketQueue(queue, socket) {
	for (var i = 0; i < queue.length; i++) {
        if (!queue[i] || queue[i].id == socket.id) {
            queue.splice(i, 1);
			i--;
		}
    }
}

function connectNextSocket() {
    isConnectionBusy = false;
    if (connectionSocketQueue.length > 0)
        startConnection(connectionSocketQueue[0]);
}

function interruptConnection(socket, note, user) {
    if (note) delete note;
    if (user) delete user;
    if (socket)
        clearSocketQueue(connectionSocketQueue, socket);
    else
        connectionSocketQueue.shift();
    connectNextSocket();
}

var isConnectionBusy = false;
var connectionSocketQueue = [];
var isDisconnectBusy = false;
var disconnectSocketQueue = [];

function finishConnection(socket, note, user) {
    // if no valid info provided will drop the client
    if (!socket || !note || !user) {
        return interruptConnection(socket, note, user);
    }
    //check view permission
    if (note.permission == 'private') {
        if (socket.request.user && socket.request.user.logged_in && socket.request.user.id == note.owner) {
            //na
        } else {
            interruptConnection(socket, note, user);
            return failConnection(403, 'connection forbidden', socket);
        }
    }
    // update user color to author color
    if (note.authors[user.userid]) {
        user.color = users[socket.id].color = note.authors[user.userid].color;
    }
    note.users[socket.id] = user;
    note.socks.push(socket);
    note.server.addClient(socket);
    note.server.setName(socket, user.name);
    note.server.setColor(socket, user.color);

    emitOnlineUsers(socket);
    emitRefresh(socket);

    //clear finished socket in queue
	clearSocketQueue(connectionSocketQueue, socket);
    //seek for next socket
    connectNextSocket();

    if (config.debug) {
        var noteId = socket.noteId;
        logger.info('SERVER connected a client to [' + noteId + ']:');
        logger.info(JSON.stringify(user));
        //logger.info(notes);
        getStatus(function (data) {
            logger.info(JSON.stringify(data));
        });
    }
}

function startConnection(socket) {
    if (isConnectionBusy) return;
    isConnectionBusy = true;
        
    var noteId = socket.noteId;
    if (!noteId) {
        return failConnection(404, 'note id not found', socket);
    }

    if (!notes[noteId]) {
        var include = [{
            model: models.User,
            as: "owner"
        }, {
            model: models.User,
            as: "lastchangeuser"
        }, {
            model: models.Author,
            as: "authors",
            include: [{
                model: models.User,
                as: "user"
            }]
        }];

        models.Note.findOne({
            where: {
                id: noteId
            },
            include: include
        }).then(function (note) {
            if (!note) {
                return failConnection(404, 'note not found', socket);
            }
            var owner = note.ownerId;
            var ownerprofile = note.owner ? models.User.parseProfile(note.owner.profile) : null;

            var lastchangeuser = note.lastchangeuserId;
            var lastchangeuserprofile = note.lastchangeuser ? models.User.parseProfile(note.lastchangeuser.profile) : null;

            var body = LZString.decompressFromBase64(note.content);
            var createtime = note.createdAt;
            var updatetime = note.lastchangeAt;
            var server = new ot.EditorSocketIOServer(body, [], noteId, ifMayEdit, operationCallback);

            var authors = {};
            for (var i = 0; i < note.authors.length; i++) {
                var author = note.authors[i];
                var profile = models.User.parseProfile(author.user.profile);
                authors[author.userId] = {
                    userid: author.userId,
                    color: author.color,
                    photo: profile.photo,
                    name: profile.name
                };
            }

            notes[noteId] = {
                id: noteId,
                owner: owner,
                ownerprofile: ownerprofile,
                permission: note.permission,
                lastchangeuser: lastchangeuser,
                lastchangeuserprofile: lastchangeuserprofile,
                socks: [],
                users: {},
                createtime: moment(createtime).valueOf(),
                updatetime: moment(updatetime).valueOf(),
                server: server,
                authors: authors,
                authorship: note.authorship ? JSON.parse(LZString.decompressFromBase64(note.authorship)) : []
            };

            return finishConnection(socket, notes[noteId], users[socket.id]);
        }).catch(function (err) {
            return failConnection(500, err, socket);
        });
    } else {
        return finishConnection(socket, notes[noteId], users[socket.id]);
    }
}

function failConnection(code, err, socket) {
    logger.error(err);
    // clear error socket in queue
    clearSocketQueue(connectionSocketQueue, socket);
    connectNextSocket();
    // emit error info
    socket.emit('info', {
        code: code
    });
    return socket.disconnect(true);
}

function disconnect(socket) {
    if (isDisconnectBusy) return;
    isDisconnectBusy = true;

    if (config.debug) {
        logger.info("SERVER disconnected a client");
        logger.info(JSON.stringify(users[socket.id]));
    }
	
    if (users[socket.id]) {
        delete users[socket.id];
    }
	var noteId = socket.noteId;
    var note = notes[noteId];
    if (note) {
        delete note.users[socket.id];
        do {
            var index = note.socks.indexOf(socket);
            if (index != -1) {
                note.socks.splice(index, 1);
            }
        } while (index != -1);
        if (Object.keys(note.users).length <= 0) {
            if (note.server.isDirty) {
                updateNote(note, function (err, _note) {
                    if (err) return logger.error('disconnect note failed: ' + err);
                    delete note.server;
                    delete notes[noteId];
                    if (config.debug) {
                        //logger.info(notes);
                        getStatus(function (data) {
                            logger.info(JSON.stringify(data));
                        });
                    }
                });
            } else {
                delete note.server;
                delete notes[noteId];
            }
        }
    }
    emitOnlineUsers(socket);

    //clear finished socket in queue
	clearSocketQueue(disconnectSocketQueue, socket);
    //seek for next socket
    isDisconnectBusy = false;
    if (disconnectSocketQueue.length > 0)
        disconnect(disconnectSocketQueue[0]);

    if (config.debug) {
        //logger.info(notes);
        getStatus(function (data) {
            logger.info(JSON.stringify(data));
        });
    }
}

function buildUserOutData(user) {
    var out = {
        id: user.id,
        login: user.login,
        userid: user.userid,
        photo: user.photo,
        color: user.color,
        cursor: user.cursor,
        name: user.name,
        idle: user.idle,
        type: user.type
    };
    return out;
}

function updateUserData(socket, user) {
    //retrieve user data from passport
    if (socket.request.user && socket.request.user.logged_in) {
        var profile = models.User.parseProfile(socket.request.user.profile);
        user.photo = profile.photo;
        user.name = profile.name;
        user.userid = socket.request.user.id;
        user.login = true;
    } else {
        user.userid = null;
        user.name = 'Guest ' + chance.last();
        user.login = false;
    }
}

function ifMayEdit(socket, callback) {
    var noteId = socket.noteId;
    if (!noteId || !notes[noteId]) return;
    var note = notes[noteId];
    var mayEdit = true;
    switch (note.permission) {
        case "freely":
            //not blocking anyone
            break;
        case "editable":
            //only login user can change
            if (!socket.request.user || !socket.request.user.logged_in)
                mayEdit = false;
            break;
        case "locked": case "private":
            //only owner can change
            if (!note.owner || note.owner != socket.request.user.id)
                mayEdit = false;
            break;
    }
    //if user may edit and this is a text operation
    if (socket.origin == 'operation' && mayEdit) {
        //save for the last change user id
		if (socket.request.user && socket.request.user.logged_in) {
        	note.lastchangeuser = socket.request.user.id;
		} else {
			note.lastchangeuser = null;
		}
    }
    return callback(mayEdit);
}

function operationCallback(socket, operation) {
    var noteId = socket.noteId;
    if (!noteId || !notes[noteId]) return;
    var note = notes[noteId];
    var userId = null;
    // save authors
    if (socket.request.user && socket.request.user.logged_in) {
        var socketId = socket.id;
        var user = users[socketId]; 
        userId = socket.request.user.id;
        if (!note.authors[userId]) {
            models.Author.create({
                noteId: noteId,
                userId: userId,
                color: users[socketId].color
            }).then(function (author) {
                note.authors[author.userId] = {
                    userid: author.userId,
                    color: author.color,
                    photo: user.photo,
                    name: user.name
                };
            }).catch(function (err) {
                return logger.error('operation callback failed: ' + err);
            });
        }
    }
    // save authorship
    var index = 0;
    var authorships = note.authorship;
    var timestamp = Date.now();
    for (var i = 0; i < operation.length; i++) {
        var op = operation[i];
        if (ot.TextOperation.isRetain(op)) {
            index += op;
        } else if (ot.TextOperation.isInsert(op)) {
            var opStart = index;
            var opEnd = index + op.length;
            var inserted = false;
            // authorship format: [userId, startPos, endPos, createdAt, updatedAt]
            if (authorships.length <= 0) authorships.push([userId, opStart, opEnd, timestamp, timestamp]);
            else {
                for (var j = 0; j < authorships.length; j++) {
                    var authorship = authorships[j];
                    if (!inserted) {
                        var nextAuthorship = authorships[j + 1] || -1;
                        if (nextAuthorship != -1 && nextAuthorship[1] >= opEnd || j >= authorships.length - 1) {
                            if (authorship[1] < opStart && authorship[2] > opStart) {
                                // divide
                                var postLength = authorship[2] - opStart;
                                authorship[2] = opStart;
                                authorship[4] = timestamp;
                                authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                authorships.splice(j + 2, 0, [authorship[0], opEnd, opEnd + postLength, authorship[3], timestamp]);
                                j += 2;
                                inserted = true;
                            } else if (authorship[1] >= opStart) {
                                authorships.splice(j, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                j += 1;
                                inserted = true;
                            } else if (authorship[2] <= opStart) {
                                authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp]);
                                j += 1;
                                inserted = true;
                            }
                        }
                    }
                    if (authorship[1] >= opStart) {
                        authorship[1] += op.length;
                        authorship[2] += op.length;
                    }
                }
            }
            index += op.length;
        } else if (ot.TextOperation.isDelete(op)) {
            var opStart = index;
            var opEnd = index - op;
            if (operation.length == 1) {
                authorships = [];
            } else if (authorships.length > 0) {
                for (var j = 0; j < authorships.length; j++) {
                    var authorship = authorships[j];
                    if (authorship[1] >= opStart && authorship[1] <= opEnd && authorship[2] >= opStart && authorship[2] <= opEnd) {
                        authorships.splice(j, 1);
                        j -= 1;
                    } else if (authorship[1] < opStart && authorship[1] < opEnd && authorship[2] > opStart && authorship[2] > opEnd) {
                        authorship[2] += op;
                        authorship[4] = timestamp;
                    } else if (authorship[2] >= opStart && authorship[2] <= opEnd) {
                        authorship[2] = opStart;
                        authorship[4] = timestamp;
                    } else if (authorship[1] >= opStart && authorship[1] <= opEnd) {
                        authorship[1] = opEnd;
                        authorship[4] = timestamp;
                    }
                    if (authorship[1] >= opEnd) {
                        authorship[1] += op;
                        authorship[2] += op;
                    }
                }
            }
            index += op;
        }
    }
    // merge
    for (var j = 0; j < authorships.length; j++) {
        var authorship = authorships[j];
        for (var k = j + 1; k < authorships.length; k++) {
            var nextAuthorship = authorships[k];
            if (nextAuthorship && authorship[0] === nextAuthorship[0] && authorship[2] === nextAuthorship[1]) {
                var minTimestamp = Math.min(authorship[3], nextAuthorship[3]);
                var maxTimestamp = Math.max(authorship[3], nextAuthorship[3]);
                authorships.splice(j, 1, [authorship[0], authorship[1], nextAuthorship[2], minTimestamp, maxTimestamp]);
                authorships.splice(k, 1);
                j -= 1;
                break;
            }
        }
    }
    // clear
    for (var j = 0; j < authorships.length; j++) {
        var authorship = authorships[j];
        if (!authorship[0]) {
            authorships.splice(j, 1);
            j -= 1;
        }
    }
    note.authorship = authorships;
}

function connection(socket) {
    if (config.maintenance) return;
    parseNoteIdFromSocket(socket, function (err, noteId) {
        if (err) {
            return failConnection(500, err, socket);
        }
        if (!noteId) {
            return failConnection(404, 'note id not found', socket);
        }
        
        // store noteId in this socket session
        socket.noteId = noteId;
        
        //initialize user data
        //random color
        var color = randomcolor();
        //make sure color not duplicated or reach max random count
        if (notes[noteId]) {
            var randomcount = 0;
            var maxrandomcount = 10;
            var found = false;
            do {
                Object.keys(notes[noteId].users).forEach(function (user) {
                    if (user.color == color) {
                        found = true;
                        return;
                    }
                });
                if (found) {
                    color = randomcolor();
                    randomcount++;
                }
            } while (found && randomcount < maxrandomcount);
        }
        //create user data
        users[socket.id] = {
            id: socket.id,
            address: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
            'user-agent': socket.handshake.headers['user-agent'],
            color: color,
            cursor: null,
            login: false,
            userid: null,
            name: null,
            idle: false,
            type: null
        };
        updateUserData(socket, users[socket.id]);

        //start connection
        connectionSocketQueue.push(socket);
        startConnection(socket);
    });

    //received client refresh request
    socket.on('refresh', function () {
        emitRefresh(socket);
    });

    //received user status
    socket.on('user status', function (data) {
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        if (config.debug)
            logger.info('SERVER received [' + noteId + '] user status from [' + socket.id + ']: ' + JSON.stringify(data));
        if (data) {
            var user = users[socket.id];
            user.idle = data.idle;
            user.type = data.type;
        }
        emitUserStatus(socket);
    });

    //received note permission change request
    socket.on('permission', function (permission) {
        //need login to do more actions
        if (socket.request.user && socket.request.user.logged_in) {
            var noteId = socket.noteId;
            if (!noteId || !notes[noteId]) return;
            var note = notes[noteId];
            //Only owner can change permission
            if (note.owner && note.owner == socket.request.user.id) {
                note.permission = permission;
                models.Note.update({
                    permission: permission
                }, {
                    where: {
                        id: noteId
                    }
                }).then(function (count) {
                    if (!count) {
                        return;
                    }
                    var out = {
                        permission: permission
                    };
                    realtime.io.to(note.id).emit('permission', out);
                    for (var i = 0, l = note.socks.length; i < l; i++) {
                        var sock = note.socks[i];
                        if (typeof sock !== 'undefined' && sock) {
                            //check view permission
                            if (permission == 'private') {
                                if (sock.request.user && sock.request.user.logged_in && sock.request.user.id == note.owner) {
                                    //na
                                } else {
                                    sock.emit('info', {
                                        code: 403
                                    });
                                    return sock.disconnect(true);
                                }
                            }
                        }
                    }
                }).catch(function (err) {
                    return logger.error('update note permission failed: ' + err);
                });
            }
        }
    });

    //reveiced when user logout or changed
    socket.on('user changed', function () {
        logger.info('user changed');
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        updateUserData(socket, notes[noteId].users[socket.id]);
        emitOnlineUsers(socket);
    });

    //received sync of online users request
    socket.on('online users', function () {
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        var users = [];
        Object.keys(notes[noteId].users).forEach(function (key) {
            var user = notes[noteId].users[key];
            if (user)
                users.push(buildUserOutData(user));
        });
        var out = {
            users: users
        };
        out = LZString.compressToUTF16(JSON.stringify(out));
        socket.emit('online users', out);
    });

    //check version
    socket.on('version', function () {
        socket.emit('version', {
            version: config.version,
            minimumCompatibleVersion: config.minimumCompatibleVersion
        });
    });

    //received cursor focus
    socket.on('cursor focus', function (data) {
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        users[socket.id].cursor = data;
        var out = buildUserOutData(users[socket.id]);
        socket.broadcast.to(noteId).emit('cursor focus', out);
    });

    //received cursor activity
    socket.on('cursor activity', function (data) {
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        users[socket.id].cursor = data;
        var out = buildUserOutData(users[socket.id]);
        socket.broadcast.to(noteId).emit('cursor activity', out);
    });

    //received cursor blur
    socket.on('cursor blur', function () {
        var noteId = socket.noteId;
        if (!noteId || !notes[noteId]) return;
        users[socket.id].cursor = null;
        var out = {
            id: socket.id
        };
        socket.broadcast.to(noteId).emit('cursor blur', out);
    });

    //when a new client disconnect
    socket.on('disconnect', function () {
        disconnectSocketQueue.push(socket);
        disconnect(socket);
    });
}

module.exports = realtime;