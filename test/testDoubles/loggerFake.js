'use strict'

const sinon = require('sinon')

function createFakeLogger () {
  return {
    error: sinon.stub(),
    warn: sinon.stub(),
    info: sinon.stub(),
    debug: sinon.stub(),
    log: sinon.stub()
  }
}

exports.createFakeLogger = createFakeLogger
