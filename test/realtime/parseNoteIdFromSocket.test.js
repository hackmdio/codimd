/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { makeMockSocket, removeModuleFromRequireCache } = require('./utils')

describe('realtime#parseNoteIdFromSocket', function () {
  let realtime

  beforeEach(() => {
    mock('../../lib/logger', {})
    mock('../../lib/history', {})
    mock('../../lib/models', {
      Note: {
        parseNoteId: function (noteId, callback) {
          callback(null, noteId)
        }
      }
    })
    mock('../../lib/config', {})
  })

  afterEach(() => {
    removeModuleFromRequireCache('../../lib/realtime')
    mock.stopAll()
  })

  it('should return null when socket not send noteId', function () {
    realtime = require('../../lib/realtime')
    const mockSocket = makeMockSocket()
    const fakeCallback = sinon.fake()
    realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
    assert(fakeCallback.called)
    assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, null])
  })

  describe('noteId exists', function () {
    beforeEach(() => {
      mock('../../lib/models', {
        Note: {
          parseNoteId: function (noteId, callback) {
            callback(null, noteId)
          }
        }
      })
    })
    it('should return noteId when noteId exists', function () {
      realtime = require('../../lib/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime')
      const fakeCallback = sinon.fake()
      realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
      assert(fakeCallback.called)
      assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, noteId])
    })
  })

  describe('noteId not exists', function () {
    beforeEach(() => {
      mock('../../lib/models', {
        Note: {
          parseNoteId: function (noteId, callback) {
            callback(null, null)
          }
        }
      })
    })
    it('should return null when noteId not exists', function () {
      realtime = require('../../lib/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime')
      const fakeCallback = sinon.fake()
      realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
      assert(fakeCallback.called)
      assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, null])
    })
  })

  describe('parse note error', function () {
    beforeEach(() => {
      mock('../../lib/models', {
        Note: {
          parseNoteId: function (noteId, callback) {
            /* eslint-disable-next-line */
            callback('error', null)
          }
        }
      })
    })
    it('should return error when noteId parse error', function () {
      realtime = require('../../lib/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime')
      const fakeCallback = sinon.fake()
      realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
      assert(fakeCallback.called)
      assert.deepStrictEqual(fakeCallback.getCall(0).args, ['error', null])
    })
  })
})
