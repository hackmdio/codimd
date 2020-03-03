/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { makeMockSocket, removeModuleFromRequireCache } = require('./utils')

describe('realtime#disconnect', function () {
  const noteId = 'note1_id'
  let realtime
  let updateNoteStub
  let emitOnlineUsersStub
  let client

  beforeEach(() => {
    mock('../../lib/logger', {
      error: () => {
      }
    })
    mock('../../lib/history', {})
    mock('../../lib/models', {
      Revision: {
        saveAllNotesRevision: () => {
        }
      }
    })
    mock('../../lib/config', {})

    realtime = require('../../lib/realtime/realtime')
    updateNoteStub = sinon.stub(realtime, 'updateNote').callsFake((note, callback) => {
      callback(null, note)
    })
    emitOnlineUsersStub = sinon.stub(realtime, 'emitOnlineUsers')
    client = makeMockSocket()
    client.noteId = noteId

    realtime.users[client.id] = {
      id: client.id,
      color: '#ff0000',
      cursor: null,
      login: false,
      userid: null,
      name: null,
      idle: false,
      type: null
    }

    realtime.getNotePool()[noteId] = {
      id: noteId,
      server: {
        isDirty: true
      },
      users: {
        [client.id]: realtime.users[client.id]
      },
      socks: [client]
    }
  })

  afterEach(() => {
    removeModuleFromRequireCache('../../lib/realtime/realtime')
    mock.stopAll()
    sinon.restore()
  })

  it('should disconnect success', function (done) {
    realtime.queueForDisconnect(client)

    setTimeout(() => {
      assert(typeof realtime.users[client.id] === 'undefined')
      assert(emitOnlineUsersStub.called)
      assert(updateNoteStub.called)
      assert(Object.keys(realtime.users).length === 0)
      assert(Object.keys(realtime.notes).length === 0)
      done()
    }, 5)
  })

  it('should disconnect success when note is not dirty', function (done) {
    realtime.notes[noteId].server.isDirty = false
    realtime.queueForDisconnect(client)

    setTimeout(() => {
      assert(typeof realtime.users[client.id] === 'undefined')
      assert(emitOnlineUsersStub.called)
      assert(updateNoteStub.called === false)
      assert(Object.keys(realtime.users).length === 0)
      assert(Object.keys(realtime.notes).length === 0)
      done()
    }, 5)
  })
})
