//realtime
//external modules
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var url = require('url');
var async = require('async');
var LZString = require('lz-string');
var shortId = require('shortid');
var randomcolor = require("randomcolor");

//core
var config = require("../config.js");

//others
var db = require("./db.js");
var Note = require("./note.js");
var User = require("./user.js");

//public
var realtime = {
    secure: secure,
    connection: connection,
    getStatus: getStatus
};

function secure(socket, next) {
    try {
        var handshakeData = socket.request;
        if (handshakeData.headers.cookie) {
            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
            handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie[config.sessionname], config.sessionsecret);
            if (handshakeData.cookie[config.sessionname] == handshakeData.sessionID) {
                next(new Error('AUTH failed: Cookie is invalid.'));
            }
        } else {
            next(new Error('AUTH failed: No cookie transmitted.'));
        }
        if (config.debug)
            console.log("AUTH success cookie: " + handshakeData.sessionID);

        next();
    } catch (ex) {
        next(new Error("AUTH failed:" + JSON.stringify(ex)));
    }
}

//actions
var users = {};
var notes = {};
var updater = setInterval(function () {
    async.each(Object.keys(notes), function (key, callback) {
        var note = notes[key];
        if (note.isDirty) {
            if (config.debug)
                console.log("updater found dirty note: " + key);
            var title = Note.getNoteTitle(LZString.decompressFromBase64(note.body));
            db.saveToDB(key, title, note.body,
                function (err, result) {});
            note.isDirty = false;
        }
        callback();
    }, function (err) {
        if (err) return console.error('updater error', err);
    });
}, 5000);

function getStatus(callback) {
    db.countFromDB(function (err, data) {
        if (err) return console.log(err);
        var regusers = 0;
        var distinctregusers = 0;
        var distinctaddresses = [];
        Object.keys(users).forEach(function (key) {
            var value = users[key];
            if(value.login)
                regusers++;
            var found = false;
            for (var i = 0; i < distinctaddresses.length; i++) {
                if (value.address == distinctaddresses[i]) {
                    found = true;
                    break;
                }
            }
            if (!found)
                distinctaddresses.push(value.address);
            if(!found && value.login)
                distinctregusers++;
        });
        User.getUserCount(function (err, regcount) {
            if (err) {
                console.log('get status failed: ' + err);
                return;
            }
            if (callback)
                callback({
                    onlineNotes: Object.keys(notes).length,
                    onlineUsers: Object.keys(users).length,
                    distinctOnlineUsers: distinctaddresses.length,
                    notesCount: data.rows[0].count,
                    registeredUsers: regcount,
                    onlineRegisteredUsers: regusers,
                    distinctOnlineRegisteredUsers: distinctregusers
                });
        });
    });
}

function getNotenameFromSocket(socket) {
    var hostUrl = url.parse(socket.handshake.headers.referer);
    var notename = hostUrl.pathname.split('/')[1];
    if (notename == config.featuresnotename) {
        return notename;
    }
    if (!Note.checkNoteIdValid(notename)) {
        socket.emit('info', {
            code: 404
        });
        return socket.disconnect();
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
            users.push({
                id: user.id,
                color: user.color,
                cursor: user.cursor
            });
    });
    notes[notename].socks.forEach(function (sock) {
        sock.emit('online users', {
            count: notes[notename].socks.length,
            users: users
        });
    });
}

var isConnectionBusy = false;
var connectionSocketQueue = [];
var isDisconnectBusy = false;
var disconnectSocketQueue = [];

function finishConnection(socket, notename) {
    notes[notename].users[socket.id] = users[socket.id];
    notes[notename].socks.push(socket);
    emitOnlineUsers(socket);
    socket.emit('refresh', {
        body: notes[notename].body
    });

    //clear finished socket in queue
    for (var i = 0; i < connectionSocketQueue.length; i++) {
        if (connectionSocketQueue[i].id == socket.id)
            connectionSocketQueue.splice(i, 1);
    }
    //seek for next socket
    isConnectionBusy = false;
    if (connectionSocketQueue.length > 0)
        startConnection(connectionSocketQueue[0]);

    if (config.debug) {
        console.log('SERVER connected a client to [' + notename + ']:');
        console.log(JSON.stringify(users[socket.id]));
        //console.log(notes);
        getStatus(function (data) {
            console.log(JSON.stringify(data));
        });
    }
}

function startConnection(socket) {
    if (isConnectionBusy) return;
    isConnectionBusy = true;

    var notename = getNotenameFromSocket(socket);
    if (!notename) return;

    if (!notes[notename]) {
        db.readFromDB(notename, function (err, data) {
            if (err) {
                socket.emit('info', {
                    code: 404
                });
                socket.disconnect();
                //clear err socket in queue
                for (var i = 0; i < connectionSocketQueue.length; i++) {
                    if (connectionSocketQueue[i].id == socket.id)
                        connectionSocketQueue.splice(i, 1);
                }
                isConnectionBusy = false;
                return console.error(err);
            }
            var body = data.rows[0].content;
            notes[notename] = {
                socks: [],
                body: body,
                isDirty: false,
                users: {}
            };
            finishConnection(socket, notename);
        });
    } else {
        finishConnection(socket, notename);
    }
}

function disconnect(socket) {
    if (isDisconnectBusy) return;
    isDisconnectBusy = true;

    if (config.debug) {
        console.log("SERVER disconnected a client");
        console.log(JSON.stringify(users[socket.id]));
    }
    var notename = getNotenameFromSocket(socket);
    if (!notename) return;
    if (users[socket.id]) {
        delete users[socket.id];
    }
    if (notes[notename]) {
        delete notes[notename].users[socket.id];
        var index = notes[notename].socks.indexOf(socket);
        if (index > -1) {
            notes[notename].socks.splice(index, 1);
        }
        if (Object.keys(notes[notename].users).length <= 0) {
            var title = Note.getNoteTitle(LZString.decompressFromBase64(notes[notename].body));
            db.saveToDB(notename, title, notes[notename].body,
                function (err, result) {
                    delete notes[notename];
                    if (config.debug) {
                        //console.log(notes);
                        getStatus(function (data) {
                            console.log(JSON.stringify(data));
                        });
                    }
                });
        }
    }
    emitOnlineUsers(socket);

    //clear finished socket in queue
    for (var i = 0; i < disconnectSocketQueue.length; i++) {
        if (disconnectSocketQueue[i].id == socket.id)
            disconnectSocketQueue.splice(i, 1);
    }
    //seek for next socket
    isDisconnectBusy = false;
    if (disconnectSocketQueue.length > 0)
        disconnect(disconnectSocketQueue[0]);

    if (config.debug) {
        //console.log(notes);
        getStatus(function (data) {
            console.log(JSON.stringify(data));
        });
    }
}


function connection(socket) {
    users[socket.id] = {
        id: socket.id,
        address: socket.handshake.address,
        'user-agent': socket.handshake.headers['user-agent'],
        otk: shortId.generate(),
        color: randomcolor({
            luminosity: 'light'
        }),
        cursor: null,
        login: false
    };

    connectionSocketQueue.push(socket);
    startConnection(socket);

    //when a new client coming or received a client refresh request
    socket.on('refresh', function (body_) {
        var notename = getNotenameFromSocket(socket);
        if (!notename) return;
        if (config.debug)
            console.log('SERVER received [' + notename + '] data updated: ' + socket.id);
        if (notes[notename].body != body_) {
            notes[notename].body = body_;
            notes[notename].isDirty = true;
        }
    });
    
    socket.on('user status', function (data) {
        if(data)
            users[socket.id].login = data.login;
    });

    socket.on('online users', function () {
        emitOnlineUsers(socket);
    });

    socket.on('version', function () {
        socket.emit('version', config.version);
    });

    socket.on('cursor focus', function (data) {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = data;
        notes[notename].socks.forEach(function (sock) {
            if (sock != socket) {
                var out = {
                    id: socket.id,
                    color: users[socket.id].color,
                    cursor: data
                };
                sock.emit('cursor focus', out);
            }
        });
    });

    socket.on('cursor activity', function (data) {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = data;
        notes[notename].socks.forEach(function (sock) {
            if (sock != socket) {
                var out = {
                    id: socket.id,
                    color: users[socket.id].color,
                    cursor: data
                };
                sock.emit('cursor activity', out);
            }
        });
    });

    socket.on('cursor blur', function () {
        var notename = getNotenameFromSocket(socket);
        if (!notename || !notes[notename]) return;
        users[socket.id].cursor = null;
        notes[notename].socks.forEach(function (sock) {
            if (sock != socket) {
                var out = {
                    id: socket.id
                };
                if (sock != socket) {
                    sock.emit('cursor blur', out);
                }
            }
        });
    });

    //when a new client disconnect
    socket.on('disconnect', function () {
        disconnectSocketQueue.push(socket);
        disconnect(socket);
    });

    //when received client change data request
    socket.on('change', function (op) {
        var notename = getNotenameFromSocket(socket);
        if (!notename) return;
        op = LZString.decompressFromBase64(op);
        if (op)
            op = JSON.parse(op);
        if (config.debug)
            console.log('SERVER received [' + notename + '] data changed: ' + socket.id + ', op:' + JSON.stringify(op));
        switch (op.origin) {
        case '+input':
        case '+delete':
        case 'paste':
        case 'cut':
        case 'undo':
        case 'redo':
        case 'drag':
            notes[notename].socks.forEach(function (sock) {
                if (sock != socket) {
                    if (config.debug)
                        console.log('SERVER emit sync data out [' + notename + ']: ' + sock.id + ', op:' + JSON.stringify(op));
                    sock.emit('change', LZString.compressToBase64(JSON.stringify(op)));
                }
            });
            break;
        }
    });
}

module.exports = realtime;