'use strict'

const sinon = require('sinon')

class EditorSocketIOServerFake {
  constructor () {
    this.addClient = sinon.stub()
    this.onOperation = sinon.stub()
    this.onGetOperations = sinon.stub()
    this.updateSelection = sinon.stub()
    this.setName = sinon.stub()
    this.setColor = sinon.stub()
    this.getClient = sinon.stub()
    this.onDisconnect = sinon.stub()
  }
}

exports.EditorSocketIOServer = EditorSocketIOServerFake
