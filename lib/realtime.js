//realtime
//external modules
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var url = require('url');
var async = require('async');
var LZString = require('lz-string');
var shortId = require('shortid');
var randomcolor = require("randomcolor");
var Chance = require('chance'),
    chance = new Chance();
var moment = require('moment');

//core
var config = require("../config.js");
var logger = require("./logger.js");

//ot
var ot = require("./ot/index.js");

//others
var db = require("./db.js");
var Note = require("./note.js");
var User = require("./user.js");

//public
var realtime = {
    io: null,
    onAuthorizeSuccess: onAuthorizeSuccess,
    onAuthorizeFail: onAuthorizeFail,
    secure: secure,
    connection: connection,
    getStatus: getStatus
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
        lastchangeuserprofile: note.lastchangeuserprofile
    };
    realtime.io.to(note.id).emit('check', out);
    /*
    for (var i = 0, l = note.socks.length; i < l; i++) {
        var sock = note.socks[i];
        sock.emit('check', out);
    };
    */
}

//actions
var users = {};
var notes = {};
//update when the note is dirty
var updater = setInterval(function () {
    async.each(Object.keys(notes), function (key, callback) {
        var note = notes[key];
        if (note.server.isDirty) {
            if (config.debug)
                logger.info("updater found dirty note: " + key);
            updaterUpdateMongo(note, function(err, result) {
                if (err) return callback(err, null);
                updaterUpdatePostgres(note, function(err, result) {
                    if (err) return callback(err, null);
                    callback(null, null);
                });
            });
        } else {
            callback(null, null);
        }
    }, function (err) {
        if (err) return logger.error('updater error', err);
    });
}, 1000);
function updaterUpdateMongo(note, callback) {
    Note.findNote(note.id, function (err, _note) {
        if (err || !_note) return callback(err, null);
        if (note.lastchangeuser) {
            if (_note.lastchangeuser != note.lastchangeuser) {
                var lastchangeuser = note.lastchangeuser;
                var lastchangeuserprofile = null;
                User.findUser(lastchangeuser, function (err, user) {
                    if (err) return callback(err, null);
                    if (user && user.profile) {
                        var profile = JSON.parse(user.profile);
                        if (profile) {
                            lastchangeuserprofile = {
                                name: profile.displayName || profile.username,
                                photo: User.parsePhotoByProfile(profile)
                            }
                            _note.lastchangeuser = lastchangeuser;
                            note.lastchangeuserprofile = lastchangeuserprofile;
                            Note.updateLastChangeUser(_note, lastchangeuser, function (err, result) {
                                if (err) return callback(err, null);
                                callback(null, null);
                            });
                        }
                    }
                });
            }
        } else {
            _note.lastchangeuser = null;
            note.lastchangeuserprofile = null;
            Note.updateLastChangeUser(_note, null, function (err, result) {
                if (err) return callback(err, null);
                callback(null, null);
            });
        }
    });
}
function updaterUpdatePostgres(note, callback) {
    //postgres update
    var body = note.server.document;
    var title = Note.getNoteTitle(body);
    title = LZString.compressToBase64(title);
    body = LZString.compressToBase64(body);
    db.saveToDB(note.id, title, body, function (err, result) {
        if (err) return callback(err, null);
        note.server.isDirty = false;
        note.updatetime = Date.now();
        emitCheck(note);
        callback(null, null);
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
        callback(null, null);
    }, function (err) {
        if (err) return logger.error('cleaner error', err);
    });
}, 60000);

function getStatus(callback) {
    db.countFromDB(function (err, data) {
        if (err) return logger.info(err);
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
        User.getUserCount(function (err, regcount) {
            if (err) {
                logger.error('get status failed: ' + err);
                return;
            }
            if (callback)
                callback({
                    onlineNotes: Object.keys(notes).length,
                    onlineUsers: Object.keys(users).length,
                    distinctOnlineUsers: distinctaddresses.length,
                    notesCount: data.rows[0].count,
                    registeredUsers: regcount,
                    onlineRegisteredUsers: regaddresses.length,
                    distinctOnlineRegisteredUsers: distinctregaddresses.length,
					isConnectionBusy: isConnectionBusy,
					connectionSocketQueueLength: connectionSocketQueue.length,
					isDisconnectBusy: isDisconnectBusy,
					disconnectSocketQueueLength: disconnectSocketQueue.length
                });
        });
    });
}

function getNotenameFromSocket(socket) {
    if (!socket || !socket.handshake || !socket.handshake.headers) {
        return;
    }
    var referer = socket.handshake.headers.referer;
    if (!referer) {
        return socket.disconnect(true);
    }
    var hostUrl = url.parse(referer);
    var notename = config.urlpath ? hostUrl.pathname.slice(config.urlpath.length + 1, hostUrl.pathname.length).split('/')[1] : hostUrl.pathname.split('/')[1];
    if (notename == config.featuresnotename) {
        return notename;
    }
    if (!Note.checkNoteIdValid(notename)) {
        socket.emit('info', {
            code: 404
        });
        return socket.disconnect(true);
    }
    notename = LZString.decompressFromBase64(notename);
    return notename;
}

function emitOnlineUsers(socket) {
    var notename = getNotenameFromSocket(socket);
    if (!notename || !notes[notename]) return;
    var users = [];
    Object.keys(notes[notename].users).forEach(function (key) {
        var user = notes[notename].users[key];
        if (user)
            users.push(buildUserOutData(user));
    });
    var out = {
        users: users
    };
    out = LZString.compressToUTF16(JSON.stringify(out));
    realtime.io.to(notename).emit('online users', out);
    /*
    for (var i = 0, l = notes[notename].socks.length; i < l; i++) {
        var sock = notes[notename].socks[i];
        if (sock && out)
            sock.emit('online users', out);
    };
    */
}

function emitUserStatus(socket) {
    var notename = getNotenameFromSocket(socket);
    if (!notename || !notes[notename]) return;
    var out = buildUserOutData(users[socket.id]);
    socket.broadcast.to(notename).emit('user status', out);
    /*
    for (var i = 0, l = notes[notename].socks.length; i < l; i++) {
        var sock = notes[notename].socks[i];
        if (sock != socket) {
            sock.emit('user status', out);
        }
    };
    */
}

function emitRefresh(socket) {
    var notename = getNotenameFromSocket(socket);
    if (!notename || !notes[notename]) return;
    var note = notes[notename];
    socket.emit('refresh', {
        docmaxlength: config.documentmaxlength,
        owner: note.owner,
        ownerprofile: note.ownerprofile,
        lastchangeuser: note.lastchangeuser,
        lastchangeuserprofile: note.lastchangeuserprofile,
        permission: note.permission,
        createtime: note.createtime,
        updatetime: note.updatetime
    });
}

function clearSocketQueue(queue, socket) {
	for (var i = 0; i < queue.length; i++) {
        if (!queue[i] || queue[i].id == socket.id) {
            queue.splice(i, 1);
			i--;
		}
    }
}

var isConnectionBusy = false;
var connectionSocketQueue = [];
var isDisconnectBusy = false;
var disconnectSocketQueue = [];

function finishConnection(socket, note, user) {
    if (!socket || !note || !user) return;
    //check view permission
    if (note.permission == 'private') {
        if (socket.request.user && socket.request.user.logged_in && socket.request.user._id == note.owner) {
            //na
        } else {
            socket.emit('info', {
                code: 403
            });
            clearSocketQueue(connectionSocketQueue, socket);
            isConnectionBusy = false;
            return socket.disconnect(true);
        }
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
    isConnectionBusy = false;
    if (connectionSocketQueue.length > 0)
        startConnection(connectionSocketQueue[0]);

    if (config.debug) {
        var notename = getNotenameFromSocket(socket);
        logger.info('SERVER connected a client to [' + notename + ']:');
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

    var notename = getNotenameFromSocket(socket);
    if (!notename) {
		clearSocketQueue(connectionSocketQueue, socket);
		isConnectionBusy = false;
		return;
	}

    if (!notes[notename]) {
        db.readFromDB(notename, function (err, data) {
            if (err) {
                socket.emit('info', {
                    code: 404
                });
                socket.disconnect(true);
                //clear err socket in queue
				clearSocketQueue(connectionSocketQueue, socket);
                isConnectionBusy = false;
                return logger.error(err);
            }

            var owner = data.rows[0].owner;
            var ownerprofile = null;

            //find or new note
            Note.findOrNewNote(notename, owner, function (err, note) {
                if (err) {
                    socket.emit('info', {
                        code: 404
                    });
                    socket.disconnect(true);
					clearSocketQueue(connectionSocketQueue, socket);
					isConnectionBusy = false;
                    return logger.error(err);
                }

                var body = LZString.decompressFromBase64(data.rows[0].content);
                //body = LZString.compressToUTF16(body);
                var createtime = data.rows[0].create_time;
                var updatetime = data.rows[0].update_time;
                var server = new ot.EditorSocketIOServer(body, [], notename, ifMayEdit);

                var lastchangeuser = note.lastchangeuser || null;
                var lastchangeuserprofile = null;

                notes[notename] = {
                    id: notename,
                    owner: owner,
                    ownerprofile: ownerprofile,
                    permission: note.permission,
                    lastchangeuser: lastchangeuser,
                    lastchangeuserprofile: lastchangeuserprofile,
                    socks: [],
                    users: {},
                    createtime: moment(createtime).valueOf(),
                    updatetime: moment(updatetime).valueOf(),
                    server: server
                };
                
                async.parallel([
                    function getlastchangeuser(callback) {
                        if (lastchangeuser) {
                            //find last change user profile if lastchangeuser exists
                            User.findUser(lastchangeuser, function (err, user) {
                                if (!err && user && user.profile) {
                                    var profile = JSON.parse(user.profile);
                                    if (profile) {
                                        lastchangeuserprofile = {
                                            name: profile.displayName || profile.username,
                                            photo: User.parsePhotoByProfile(profile)
                                        }
                                        notes[notename].lastchangeuserprofile = lastchangeuserprofile;
                                    }
                                }
                                callback(null, null);
                            });
                        } else {
                            callback(null, null);
                        }
                    },
                    function getowner(callback) {
                        if (owner && owner != "null") {
                            //find owner profile if owner exists
                            User.findUser(owner, function (err, user) {
                                if (!err && user && user.profile) {
                                    var profile = JSON.parse(user.profile);
                                    if (profile) {
                                        ownerprofile = {
                                            name: profile.displayName || profile.username,
                                            photo: User.parsePhotoByProfile(profile)
                                        }
                                        notes[notename].ownerprofile = ownerprofile;
                                    }
                                }
                                callback(null, null);
                            });
                        } else {
                            callback(null, null);
                        }
                    }
                ], function(err, results){
                    if (err) return;
                    finishConnection(socket, notes[notename], users[socket.id]);
                });
            });
        });
    } else {
        finishConnection(socket, notes[notename], users[socket.id]);
    }
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
	var notename = getNotenameFromSocket(socket);
    var note = notes[notename];
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
                var body = note.server.document;
                var title = Note.getNoteTitle(body);
                title = LZString.compressToBase64(title);
                body = LZString.compressToBase64(body);
                db.saveToDB(notename, title, body,
                    function (err, result) {
                        delete notes[notename];
                        if (config.debug) {
                            //logger.info(notes);
                            getStatus(function (data) {
                                logger.info(JSON.stringify(data));
                            });
                        }
                    });
            } else {
                delete notes[notename];
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
        var profile = JSON.parse(socket.request.user.profile);
        user.photo = User.parsePhotoByProfile(profile);
        user.name = profile.displayName || profile.username;
        user.userid = socket.request.user._id;
        user.login = true;
    } else {
        user.userid = null;
        user.name = 'Guest ' + chance.last();
        user.login = false;
    }
}

function ifMayEdit(socket, callback) {
    var notename = getNotenameFromSocket(socket);
    if (!notename || !notes[notename]) return;
    var note = notes[notename];
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
            if (note.owner != socket.request.user._id)
                mayEdit = false;
            break;
    }
    //if user may edit and this note have owner (not anonymous usage)
    if (socket.origin == 'operation' && mayEdit && note.owner && note.owner != "null") {
        //save for the last change user id
		if (socket.request.user && socket.request.user.logged_in) {
        	note.lastchangeuser = socket.request.user._id;
		} else {
			note.lastchangeuser = null;
		}
    }
    callback(mayEdit);
}

function connection(socket) {
    //split notename from socket
    var notename = getNotenameFromSocket(socket);

    //initialize user data
    //random color
    var color = randomcolor({
        luminosity: 'light'
    });
    //make sure color not duplicated or reach max random count
    if (notename && notes[notename]) {
        var randomcount = 0;
        var maxrandomcount = 5;
        var found = false;
        do {
            Object.keys(notes[notename].users).forEach(function (user) {
                if (user.color == color) {
                    found = true;
                    return;
                }
            });
            if (found) {
                color = randomcolor({
                    luminosity: 'light'
                });
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

    //received client refresh request
    socket.on('refresh', function () {
        emitRefresh(socket);
    });

    //received user status
    socket.on('user status', function (data) {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        if (config.debug)
            logger.info('SERVER received [' + notename + '] user status from [' + socket.id + ']: ' + JSON.stringify(data));
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
            var notename = getNotenameFromSocket(socket);
            if (!notename || !notes[notename]) return;
            var note = notes[notename];
            //Only owner can change permission
            if (note.owner == socket.request.user._id) {
                note.permission = permission;
                Note.findNote(notename, function (err, _note) {
                    if (err || !_note) {
                        return;
                    }
                    Note.updatePermission(_note, permission, function (err, _note) {
                        if (err || !_note) {
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
                                    if (sock.request.user && sock.request.user.logged_in && sock.request.user._id == note.owner) {
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
                    });
                });
            }
        }
    });

    //reveiced when user logout or changed
    socket.on('user changed', function () {
        logger.info('user changed');
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        updateUserData(socket, notes[notename].users[socket.id]);
        emitOnlineUsers(socket);
    });

    //received sync of online users request
    socket.on('online users', function () {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        var users = [];
        Object.keys(notes[notename].users).forEach(function (key) {
            var user = notes[notename].users[key];
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
        socket.emit('version', config.version);
    });

    //received cursor focus
    socket.on('cursor focus', function (data) {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = data;
        var out = buildUserOutData(users[socket.id]);
        socket.broadcast.to(notename).emit('cursor focus', out);
        /*
        for (var i = 0, l = notes[notename].socks.length; i < l; i++) {
            var sock = notes[notename].socks[i];
            if (sock != socket) {
                sock.emit('cursor focus', out);
            }
        };
        */
    });

    //received cursor activity
    socket.on('cursor activity', function (data) {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = data;
        var out = buildUserOutData(users[socket.id]);
        socket.broadcast.to(notename).emit('cursor activity', out);
        /*
        for (var i = 0, l = notes[notename].socks.length; i < l; i++) {
            var sock = notes[notename].socks[i];
            if (sock != socket) {
                sock.emit('cursor activity', out);
            }
        };
        */
    });

    //received cursor blur
    socket.on('cursor blur', function () {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = null;
        var out = {
            id: socket.id
        };
        socket.broadcast.to(notename).emit('cursor blur', out);
        /*
        for (var i = 0, l = notes[notename].socks.length; i < l; i++) {
            var sock = notes[notename].socks[i];
            if (sock != socket) {
                sock.emit('cursor blur', out);
            }
        };
        */
    });

    //when a new client disconnect
    socket.on('disconnect', function () {
        disconnectSocketQueue.push(socket);
        disconnect(socket);
    });
}

module.exports = realtime;