/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')
const { createFakeLogger } = require('../testDoubles/loggerFake')
const { removeModuleFromRequireCache, makeMockSocket } = require('./utils')

describe('cleanDanglingUser', function () {
  let clock
  beforeEach(() => {
    clock = sinon.useFakeTimers()
    mock('../../dist/models', {})
    mock('../../dist/processQueue', require('../testDoubles/ProcessQueueFake'))
    mock('../../dist/logger', createFakeLogger())
    mock('../../dist/history', {})
    mock('../../dist/services/note', {
      saveAllNotesRevision: () => {
      }
    })
    mock('../../dist/config', {
      debug: true,
      db: {}
    })
    mock('../../dist/realtimeUpdateDirtyNoteJob', require('../testDoubles/realtimeJobStub'))
    mock('../../dist/realtimeSaveRevisionJob', require('../testDoubles/realtimeJobStub'))
  })

  afterEach(() => {
    clock.restore()
    removeModuleFromRequireCache('../../dist/realtime/realtime')
    mock.stopAll()
    sinon.restore()
  })

  it('should call queueForDisconnectSpy when user is dangling', (done) => {
    const realtime = require('../../dist/realtime/realtime')
    const queueForDisconnectSpy = sinon.spy(realtime, 'queueForDisconnect')
    realtime.io = {
      to: sinon.stub().callsFake(function () {
        return {
          emit: sinon.fake()
        }
      }),
      sockets: {
        connected: {}
      }
    }
    const user1Socket = makeMockSocket()
    const user2Socket = makeMockSocket()

    user1Socket.rooms.push('room1')

    realtime.io.sockets.connected[user1Socket.id] = user1Socket
    realtime.io.sockets.connected[user2Socket.id] = user2Socket

    realtime.users[user1Socket.id] = user1Socket
    realtime.users[user2Socket.id] = user2Socket
    clock.tick(60000)
    clock.restore()
    setTimeout(() => {
      assert(queueForDisconnectSpy.called)
      done()
    }, 50)
  })
})
