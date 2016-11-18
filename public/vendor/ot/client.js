// translation of https://github.com/djspiewak/cccp/blob/master/agent/src/main/scala/com/codecommit/cccp/agent/state.scala

if (typeof ot === 'undefined') {
  var ot = {};
}

ot.Client = (function (global) {
  'use strict';

  // Client constructor
  function Client (revision) {
    this.revision = revision; // the next expected revision number
    this.setState(synchronized_); // start state
  }

  Client.prototype.setState = function (state) {
    this.state = state;
  };

  // Call this method when the user changes the document.
  Client.prototype.applyClient = function (operation) {
    this.setState(this.state.applyClient(this, operation));
  };

  // Call this method with a new operation from the server
  Client.prototype.applyServer = function (revision, operation) {
    this.setState(this.state.applyServer(this, revision, operation));
  };

  Client.prototype.applyOperations = function (head, operations) {
    this.setState(this.state.applyOperations(this, head, operations));
  };

  Client.prototype.serverAck = function (revision) {
    this.setState(this.state.serverAck(this, revision));
  };

  Client.prototype.serverReconnect = function () {
    if (typeof this.state.resend === 'function') { this.state.resend(this); }
  };

  // Transforms a selection from the latest known server state to the current
  // client state. For example, if we get from the server the information that
  // another user's cursor is at position 3, but the server hasn't yet received
  // our newest operation, an insertion of 5 characters at the beginning of the
  // document, the correct position of the other user's cursor in our current
  // document is 8.
  Client.prototype.transformSelection = function (selection) {
    return this.state.transformSelection(selection);
  };

  // Override this method.
  Client.prototype.sendOperation = function (revision, operation) {
    throw new Error("sendOperation must be defined in child class");
  };

  // Override this method.
  Client.prototype.applyOperation = function (operation) {
    throw new Error("applyOperation must be defined in child class");
  };


  // In the 'Synchronized' state, there is no pending operation that the client
  // has sent to the server.
  function Synchronized () {}
  Client.Synchronized = Synchronized;

  Synchronized.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, send the operation to the server and
    // switch to the 'AwaitingConfirm' state
    client.sendOperation(client.revision, operation);
    return new AwaitingConfirm(operation);
  };

  Synchronized.prototype.applyServer = function (client, revision, operation) {
    if (revision - client.revision > 1) {
      throw new Error("Invalid revision.");
    }
    client.revision = revision;
    // When we receive a new operation from the server, the operation can be
    // simply applied to the current document
    client.applyOperation(operation);
    return this;
  };

  Synchronized.prototype.serverAck = function (client, revision) {
    throw new Error("There is no pending operation.");
  };

  // Nothing to do because the latest server state and client state are the same.
  Synchronized.prototype.transformSelection = function (x) { return x; };

  // Singleton
  var synchronized_ = new Synchronized();


  // In the 'AwaitingConfirm' state, there's one operation the client has sent
  // to the server and is still waiting for an acknowledgement.
  function AwaitingConfirm (outstanding) {
    // Save the pending operation
    this.outstanding = outstanding;
  }
  Client.AwaitingConfirm = AwaitingConfirm;

  AwaitingConfirm.prototype.applyClient = function (client, operation) {
    // When the user makes an edit, don't send the operation immediately,
    // instead switch to 'AwaitingWithBuffer' state
    return new AwaitingWithBuffer(this.outstanding, operation);
  };

  AwaitingConfirm.prototype.applyServer = function (client, revision, operation) {
    if (revision - client.revision > 1) {
      throw new Error("Invalid revision.");
    }
    client.revision = revision;
    // This is another client's operation. Visualization:
    //
    //                   /\
    // this.outstanding /  \ operation
    //                 /    \
    //                 \    /
    //  pair[1]         \  / pair[0] (new outstanding)
    //  (can be applied  \/
    //  to the client's
    //  current document)
    var pair = operation.constructor.transform(this.outstanding, operation);
    client.applyOperation(pair[1]);
    return new AwaitingConfirm(pair[0]);
  };

  AwaitingConfirm.prototype.serverAck = function (client, revision) {
    if (revision - client.revision > 1) {
      return new Stale(this.outstanding, client, revision).getOperations();
    }
    client.revision = revision;
    // The client's operation has been acknowledged
    // => switch to synchronized state
    return synchronized_;
  };

  AwaitingConfirm.prototype.transformSelection = function (selection) {
    return selection.transform(this.outstanding);
  };

  AwaitingConfirm.prototype.resend = function (client) {
    // The confirm didn't come because the client was disconnected.
    // Now that it has reconnected, we resend the outstanding operation.
    client.sendOperation(client.revision, this.outstanding);
  };


  // In the 'AwaitingWithBuffer' state, the client is waiting for an operation
  // to be acknowledged by the server while buffering the edits the user makes
  function AwaitingWithBuffer (outstanding, buffer) {
    // Save the pending operation and the user's edits since then
    this.outstanding = outstanding;
    this.buffer = buffer;
  }
  Client.AwaitingWithBuffer = AwaitingWithBuffer;

  AwaitingWithBuffer.prototype.applyClient = function (client, operation) {
    // Compose the user's changes onto the buffer
    var newBuffer = this.buffer.compose(operation);
    return new AwaitingWithBuffer(this.outstanding, newBuffer);
  };

  AwaitingWithBuffer.prototype.applyServer = function (client, revision, operation) {
    if (revision - client.revision > 1) {
      throw new Error("Invalid revision.");
    }
    client.revision = revision;
    // Operation comes from another client
    //
    //                       /\
    //     this.outstanding /  \ operation
    //                     /    \
    //                    /\    /
    //       this.buffer /  \* / pair1[0] (new outstanding)
    //                  /    \/
    //                  \    /
    //          pair2[1] \  / pair2[0] (new buffer)
    // the transformed    \/
    // operation -- can
    // be applied to the
    // client's current
    // document
    //
    // * pair1[1]
    var transform = operation.constructor.transform;
    var pair1 = transform(this.outstanding, operation);
    var pair2 = transform(this.buffer, pair1[1]);
    client.applyOperation(pair2[1]);
    return new AwaitingWithBuffer(pair1[0], pair2[0]);
  };

  AwaitingWithBuffer.prototype.serverAck = function (client, revision) {
    if (revision - client.revision > 1) {
      return new StaleWithBuffer(this.outstanding, this.buffer, client, revision).getOperations();
    }
    client.revision = revision;
    // The pending operation has been acknowledged
    // => send buffer
    client.sendOperation(client.revision, this.buffer);
    return new AwaitingConfirm(this.buffer);
  };

  AwaitingWithBuffer.prototype.transformSelection = function (selection) {
    return selection.transform(this.outstanding).transform(this.buffer);
  };

  AwaitingWithBuffer.prototype.resend = function (client) {
    // The confirm didn't come because the client was disconnected.
    // Now that it has reconnected, we resend the outstanding operation.
    client.sendOperation(client.revision, this.outstanding);
  };


  function Stale(acknowlaged, client, revision) {
    this.acknowlaged = acknowlaged;
    this.client = client;
    this.revision = revision;
  }
  Client.Stale = Stale;

  Stale.prototype.applyClient = function (client, operation) {
    return new StaleWithBuffer(this.acknowlaged, operation, client, this.revision);
  };

  Stale.prototype.applyServer = function (client, revision, operation) {
    throw new Error("Ignored server-side change.");
  };

  Stale.prototype.applyOperations = function (client, head, operations) {
    var transform = this.acknowlaged.constructor.transform;
    for (var i = 0; i < operations.length; i++) {
      var op = ot.TextOperation.fromJSON(operations[i]);
      var pair = transform(this.acknowlaged, op);
      client.applyOperation(pair[1]);
      this.acknowlaged = pair[0];
    }
    client.revision = this.revision;
    return synchronized_;
  };

  Stale.prototype.serverAck = function (client, revision) {
    throw new Error("There is no pending operation.");
  };

  Stale.prototype.transformSelection = function (selection) {
    return selection;
  };

  Stale.prototype.getOperations = function () {
    this.client.getOperations(this.client.revision, this.revision - 1); // acknowlaged is the one at revision
    return this;
  };


  function StaleWithBuffer(acknowlaged, buffer, client, revision) {
    this.acknowlaged = acknowlaged;
    this.buffer = buffer;
    this.client = client;
    this.revision = revision;
  }
  Client.StaleWithBuffer = StaleWithBuffer;

  StaleWithBuffer.prototype.applyClient = function (client, operation) {
    var buffer = this.buffer.compose(operation);
    return new StaleWithBuffer(this.acknowlaged, buffer, client, this.revision);
  };

  StaleWithBuffer.prototype.applyServer = function (client, revision, operation) {
    throw new Error("Ignored server-side change.");
  };

  StaleWithBuffer.prototype.applyOperations = function (client, head, operations) {
    var transform = this.acknowlaged.constructor.transform;
    for (var i = 0; i < operations.length; i++) {
      var op = ot.TextOperation.fromJSON(operations[i]);
      var pair1 = transform(this.acknowlaged, op);
      var pair2 = transform(this.buffer, pair1[1]);
      client.applyOperation(pair2[1]);
      this.acknowlaged = pair1[0];
      this.buffer = pair2[0];
    }
    client.revision = this.revision;
    client.sendOperation(client.revision, this.buffer);
    return new AwaitingConfirm(this.buffer);
  };

  StaleWithBuffer.prototype.serverAck = function (client, revision) {
    throw new Error("There is no pending operation.");
  };

  StaleWithBuffer.prototype.transformSelection = function (selection) {
    return selection;
  };

  StaleWithBuffer.prototype.getOperations = function () {
    this.client.getOperations(this.client.revision, this.revision - 1); // acknowlaged is the one at revision
    return this;
  };


  return Client;

}(this));

if (typeof module === 'object') {
  module.exports = ot.Client;
}

