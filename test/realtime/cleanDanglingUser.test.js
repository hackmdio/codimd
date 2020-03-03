/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')
const { removeModuleFromRequireCache, makeMockSocket } = require('./utils')

describe('cleanDanglingUser', function () {
  let clock
  beforeEach(() => {
    clock = sinon.useFakeTimers()
    mock('../../lib/processQueue', require('../testDoubles/ProcessQueueFake'))
    mock('../../lib/logger', {
      error: () => {},
      info: () => {}
    })
    mock('../../lib/history', {})
    mock('../../lib/models', {
      Revision: {
        saveAllNotesRevision: () => {
        }
      }
    })
    mock('../../lib/config', {
      debug: true
    })
    mock('../../lib/realtimeUpdateDirtyNoteJob', require('../testDoubles/realtimeJobStub'))
    mock('../../lib/realtimeSaveRevisionJob', require('../testDoubles/realtimeJobStub'))
  })

  afterEach(() => {
    clock.restore()
    removeModuleFromRequireCache('../../lib/realtime/realtime')
    mock.stopAll()
    sinon.restore()
  })

  it('should call queueForDisconnectSpy when user is dangling', (done) => {
    const realtime = require('../../lib/realtime/realtime')
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
