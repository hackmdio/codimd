'use strict';

var EventEmitter = require('events').EventEmitter;
var TextOperation = require('./text-operation');
var WrappedOperation = require('./wrapped-operation');
var Server = require('./server');
var Selection = require('./selection');
var util = require('util');

var logger = require('../logger');

function EditorSocketIOServer(document, operations, docId, mayWrite, operationCallback) {
    EventEmitter.call(this);
    Server.call(this, document, operations);
    this.users = {};
    this.docId = docId;
    this.mayWrite = mayWrite || function (_, cb) {
        cb(true);
    };
    this.operationCallback = operationCallback;
}

util.inherits(EditorSocketIOServer, Server);
extend(EditorSocketIOServer.prototype, EventEmitter.prototype);

function extend(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
}

EditorSocketIOServer.prototype.addClient = function (socket) {
    var self = this;
    socket.join(this.docId);
    var docOut = {
        str: this.document,
        revision: this.operations.length,
        clients: this.users
    };
    socket.emit('doc', docOut);
    socket.on('operation', function (revision, operation, selection) {
        socket.origin = 'operation';
        self.mayWrite(socket, function (mayWrite) {
            if (!mayWrite) {
                logger.info("User doesn't have the right to edit.");
                return;
            }
            try {
                self.onOperation(socket, revision, operation, selection);
                if (typeof self.operationCallback === 'function')
                    self.operationCallback(socket, operation);
            } catch (err) {
                setTimeout(function() {
                    var docOut = {
                        str: self.document,
                        revision: self.operations.length,
                        clients: self.users,
                        force: true
                    };
                    socket.emit('doc', docOut);
                }, 100);
            }
        });
    });
    socket.on('get_operations', function (base, head) {
        self.onGetOperations(socket, base, head);
    });
    socket.on('selection', function (obj) {
        socket.origin = 'selection';
        self.mayWrite(socket, function (mayWrite) {
            if (!mayWrite) {
                logger.info("User doesn't have the right to edit.");
                return;
            }
            self.updateSelection(socket, obj && Selection.fromJSON(obj));
        });
    });
    socket.on('disconnect', function () {
        logger.debug("Disconnect");
        socket.leave(self.docId);
        self.onDisconnect(socket);
        /*
        if (socket.manager && socket.manager.sockets.clients(self.docId).length === 0) {
          self.emit('empty-room');
        }
        */
    });
};

EditorSocketIOServer.prototype.onOperation = function (socket, revision, operation, selection) {
    var wrapped;
    try {
        wrapped = new WrappedOperation(
            TextOperation.fromJSON(operation),
            selection && Selection.fromJSON(selection)
        );
    } catch (exc) {
        logger.error("Invalid operation received: ");
        logger.error(exc);
        throw new Error(exc);
    }

    try {
        var clientId = socket.id;
        var wrappedPrime = this.receiveOperation(revision, wrapped);
        if(!wrappedPrime) return;
        logger.debug("new operation: " + JSON.stringify(wrapped));
        this.getClient(clientId).selection = wrappedPrime.meta;
        revision = this.operations.length;
        socket.emit('ack', revision);
        socket.broadcast.in(this.docId).emit(
            'operation', clientId, revision,
            wrappedPrime.wrapped.toJSON(), wrappedPrime.meta
        );
        //set document is dirty
        this.isDirty = true;
    } catch (exc) {
        logger.error(exc);
        throw new Error(exc);
    }
};

EditorSocketIOServer.prototype.onGetOperations = function (socket, base, head) {
    var operations = this.operations.slice(base, head).map(function (op) {
        return op.wrapped.toJSON();
    });
    socket.emit('operations', head, operations);
};

EditorSocketIOServer.prototype.updateSelection = function (socket, selection) {
    var clientId = socket.id;
    if (selection) {
        this.getClient(clientId).selection = selection;
    } else {
        delete this.getClient(clientId).selection;
    }
    socket.broadcast.to(this.docId).emit('selection', clientId, selection);
};

EditorSocketIOServer.prototype.setName = function (socket, name) {
    var clientId = socket.id;
    this.getClient(clientId).name = name;
    socket.broadcast.to(this.docId).emit('set_name', clientId, name);
};

EditorSocketIOServer.prototype.setColor = function (socket, color) {
    var clientId = socket.id;
    this.getClient(clientId).color = color;
    socket.broadcast.to(this.docId).emit('set_color', clientId, color);
};

EditorSocketIOServer.prototype.getClient = function (clientId) {
    return this.users[clientId] || (this.users[clientId] = {});
};

EditorSocketIOServer.prototype.onDisconnect = function (socket) {
    var clientId = socket.id;
    delete this.users[clientId];
    socket.broadcast.to(this.docId).emit('client_left', clientId);
};

module.exports = EditorSocketIOServer;
