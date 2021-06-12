/* eslint-env node, mocha */
'use strict'

const mock = require('mock-require')
const assert = require('assert')

const { makeMockSocket } = require('./utils')

describe('realtime#extractNoteIdFromSocket', function () {
  beforeEach(() => {
    mock('../../dist/logger', {})
    mock('../../dist/history', {})
    mock('../../dist/models', {})
  })

  afterEach(() => {
    delete require.cache[require.resolve('../../dist/realtime/realtime')]
    mock.stopAll()
  })

  describe('urlPath not set', function () {
    beforeEach(() => {
      mock('../../dist/config', {})
      realtime = require('../../dist/realtime/realtime')
    })

    let realtime

    it('return false if socket or socket.handshake not exists', function () {
      let noteId = realtime.extractNoteIdFromSocket()
      assert.strictEqual(false, noteId)

      noteId = realtime.extractNoteIdFromSocket({})
      assert.strictEqual(false, noteId)
    })

    it('return false if query not set and referer not set', function () {
      const noteId = realtime.extractNoteIdFromSocket(makeMockSocket({
        otherHeader: 1
      }, {
        otherQuery: 1
      }))
      assert.strictEqual(false, noteId)
    })

    it('return noteId from query', function () {
      // Arrange
      const incomingNoteId = 'myNoteId'
      const incomingSocket = makeMockSocket(undefined, { noteId: incomingNoteId })

      // Act
      const noteId = realtime.extractNoteIdFromSocket(incomingSocket)
      // Assert
      assert.strictEqual(noteId, incomingNoteId)
    })

    it('return noteId from old method (referer)', function () {
      // Arrange
      const incomingNoteId = 'myNoteId'
      const incomingSocket = makeMockSocket({
        referer: `https://localhost:3000/${incomingNoteId}`
      })

      // Act
      const noteId = realtime.extractNoteIdFromSocket(incomingSocket)
      // Assert
      assert.strictEqual(noteId, incomingNoteId)
    })
  })

  describe('urlPath is set', function () {
    let realtime
    it('return noteId from old method (referer) and urlPath set', function () {
      // Arrange
      const urlPath = 'hello'
      mock('../../dist/config', {
        urlPath: urlPath
      })
      realtime = require('../../dist/realtime/realtime')
      const incomingNoteId = 'myNoteId'
      const incomingSocket = makeMockSocket({
        referer: `https://localhost:3000/${urlPath}/${incomingNoteId}`
      })

      // Act
      const noteId = realtime.extractNoteIdFromSocket(incomingSocket)
      // Assert
      assert.strictEqual(noteId, incomingNoteId)
    })
  })
})
