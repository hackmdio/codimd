/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')

const { makeMockSocket, removeModuleFromRequireCache } = require('./utils')

describe('realtime#parseNoteIdFromSocketAsync', function () {
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
    removeModuleFromRequireCache('../../lib/realtime/realtime')
    mock.stopAll()
  })

  it('should return null when socket not send noteId', async function () {
    realtime = require('../../lib/realtime/realtime')
    const mockSocket = makeMockSocket()
    try {
      const notes = await realtime.parseNoteIdFromSocketAsync(mockSocket)
      assert(notes === null)
    } catch (err) {
      assert.fail('should not occur any error')
    }
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
    it('should return noteId when noteId exists', async function () {
      realtime = require('../../lib/realtime/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime/realtime')
      let parsedNoteId
      try {
        parsedNoteId = await realtime.parseNoteIdFromSocketAsync(mockSocket)
      } catch (err) {
        assert.fail(`should not occur any error ${err} `)
      }
      assert(parsedNoteId === noteId)
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
    it('should return null when noteId not exists', async function () {
      realtime = require('../../lib/realtime/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime/realtime')
      const parsedNoteId = await realtime.parseNoteIdFromSocketAsync(mockSocket)
      assert(parsedNoteId === null)
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
    it('should return error when noteId parse error', async function () {
      realtime = require('../../lib/realtime/realtime')
      const noteId = '123456'
      const mockSocket = makeMockSocket(undefined, {
        noteId: noteId
      })
      realtime = require('../../lib/realtime/realtime')
      try {
        await realtime.parseNoteIdFromSocketAsync(mockSocket)
      } catch (err) {
        assert(err === 'error')
      }
    })
  })
})
