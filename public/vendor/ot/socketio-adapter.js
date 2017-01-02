/*global ot */

ot.SocketIOAdapter = (function () {
    'use strict';

    function SocketIOAdapter(socket) {
        this.socket = socket;

        var self = this;
        socket.on('client_left', function (clientId) {
            self.trigger('client_left', clientId);
        });
        socket.on('set_name', function (clientId, name) {
            self.trigger('set_name', clientId, name);
        });
        socket.on('set_color', function (clientId, color) {
            self.trigger('set_color', clientId, color);
        });
        socket.on('ack', function (revision) {
            self.trigger('ack', revision);
        });
        socket.on('operation', function (clientId, revision, operation, selection) {
            self.trigger('operation', revision, operation);
            self.trigger('selection', clientId, selection);
        });
        socket.on('operations', function (head, operations) {
            self.trigger('operations', head, operations);
        });
        socket.on('selection', function (clientId, selection) {
            self.trigger('selection', clientId, selection);
        });
        socket.on('reconnect', function () {
            self.trigger('reconnect');
        });
    }

    SocketIOAdapter.prototype.sendOperation = function (revision, operation, selection) {
        this.socket.emit('operation', revision, operation, selection);
    };

    SocketIOAdapter.prototype.sendSelection = function (selection) {
        this.socket.emit('selection', selection);
    };

    SocketIOAdapter.prototype.getOperations = function (base, head) {
        this.socket.emit('get_operations', base, head);
    };

    SocketIOAdapter.prototype.registerCallbacks = function (cb) {
        this.callbacks = cb;
    };

    SocketIOAdapter.prototype.trigger = function (event) {
        var args = Array.prototype.slice.call(arguments, 1);
        var action = this.callbacks && this.callbacks[event];
        if (action) {
            action.apply(this, args);
        }
    };

    return SocketIOAdapter;

}());