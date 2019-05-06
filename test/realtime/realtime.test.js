'use strict'

/* eslint-env node, mocha */

const mock = require('mock-require')
const assert = require('assert')
const sinon = require('sinon')

function makeMockSocket (headers, query) {
  const broadCastChannelCache = {}
  return {
    id: Math.round(Math.random() * 10000),
    handshake: {
      headers: Object.assign({}, headers),
      query: Object.assign({}, query)
    },
    on: sinon.fake(),
    emit: sinon.fake(),
    broadCastChannelCache: {},
    broadcast: {
      to: (channel) => {
        if (!broadCastChannelCache[channel]) {
          broadCastChannelCache[channel] = {
            channel: channel,
            emit: sinon.fake()
          }
        }
        return broadCastChannelCache[channel]
      }
    },
    disconnect: sinon.fake()
  }
}

function removeModuleFromRequireCache (modulePath) {
  delete require.cache[require.resolve(modulePath)]
}

describe('realtime', function () {

  describe('update note is dirty timer', function () {
    let realtime
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
    })

    afterEach(() => {
      removeModuleFromRequireCache('../../lib/realtime')
      mock.stopAll()
    })

    it('should update note when note is dirty', (done) => {
      const clock = sinon.useFakeTimers()
      realtime = require('../../lib/realtime')
      sinon.stub(realtime, 'updateNote').callsFake(function (note, callback) {
        callback(null, null)
      })
      const socketIoEmitFake = sinon.fake()
      realtime.io = {
        to: sinon.stub().callsFake(function () {
          return {
            emit: socketIoEmitFake
          }
        })
      }
      realtime.notes['note1'] = {
        server: {
          isDirty: false
        },
        socks: []
      }
      let note2 = {
        server: {
          isDirty: true
        },
        socks: []
      }
      realtime.notes['note2'] = note2

      clock.tick(1000)
      clock.restore()

      setTimeout(() => {
        assert(note2.server.isDirty === false)
        done()
      }, 50)
    })
  })

  describe('updateNote', function () {
    let realtime, fakeNote
    beforeEach(() => {
      mock('../../lib/logger', {
        error: () => {
        }
      })
      mock('../../lib/history', {})
      mock('../../lib/models', {
        Note: {
          findOne: async function () {
            return fakeNote
          }
        }
      })
      mock('../../lib/config', {})
    })

    afterEach(() => {
      mock.stopAll()
    })

    it('should return null when note not found', function (done) {
      fakeNote = null
      realtime = require('../../lib/realtime')

      sinon.stub(realtime, 'finishUpdateNote').callsFake(function (a, b, callback) {
        callback(null, b)
      })

      const fakeCallback = sinon.fake()
      realtime.updateNote({ id: '123' }, fakeCallback)
      setTimeout(() => {
        assert.ok(fakeCallback.called)
        assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, null])
        sinon.restore()
        done()
      }, 50)
    })
  })

  describe('finishUpdateNote', function () {
    let realtime
    beforeEach(() => {
      mock('../../lib/logger', {})
      mock('../../lib/history', {})
      mock('../../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../../lib/config', {})
      realtime = require('../../lib/realtime')
    })

    afterEach(() => {
      removeModuleFromRequireCache('../../lib/realtime')
      mock.stopAll()
    })

    it('return null when note is null', () => {
      const fakeCallback = sinon.fake()

      realtime.finishUpdateNote(null, {}, fakeCallback)

      assert.ok(fakeCallback.calledOnce)
      assert.deepStrictEqual(fakeCallback.lastCall.args, [null, null])
    })
  })

  describe('connection', function () {
    let realtime
    beforeEach(() => {
      mock('../../lib/logger', {
        error: () => {
        }
      })
      mock('../../lib/history', {})
      mock('../../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../../lib/config', {})
      realtime = require('../../lib/realtime')
    })

    afterEach(() => {
      removeModuleFromRequireCache('../../lib/realtime')
      mock.stopAll()
      sinon.restore()
    })

    describe('fail', function () {
      it('should fast return when server not start', () => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = true
        const spy = sinon.spy(realtime, 'parseNoteIdFromSocket')
        realtime.connection(mockSocket)
        assert(!spy.called)
      })

      it('should failed when parse noteId occur error', () => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = false
        const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocket').callsFake((socket, callback) => {
          /* eslint-disable-next-line */
          callback('error', null)
        })

        const failConnectionSpy = sinon.stub(realtime, 'failConnection')

        realtime.connection(mockSocket)

        assert(parseNoteIdFromSocketSpy.called)
        assert(failConnectionSpy.calledOnce)
        assert.deepStrictEqual(failConnectionSpy.lastCall.args, [500, 'error', mockSocket])
      })

      it('should failed when noteId not exists', () => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = false
        const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocket').callsFake((socket, callback) => {
          /* eslint-disable-next-line */
          callback(null, null)
        })

        const failConnectionSpy = sinon.stub(realtime, 'failConnection')

        realtime.connection(mockSocket)

        assert(parseNoteIdFromSocketSpy.called)
        assert(failConnectionSpy.calledOnce)
        assert.deepStrictEqual(failConnectionSpy.lastCall.args, [404, 'note id not found', mockSocket])
      })
    })

    it('should success connect', function () {
      const mockSocket = makeMockSocket()
      const noteId = 'note123'
      realtime.maintenance = false
      const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocket').callsFake((socket, callback) => {
        /* eslint-disable-next-line */
        callback(null, noteId)
      })
      const failConnectionStub = sinon.stub(realtime, 'failConnection')
      const updateUserDataStub = sinon.stub(realtime, 'updateUserData')
      const startConnectionStub = sinon.stub(realtime, 'startConnection')

      realtime.connection(mockSocket)

      assert.ok(parseNoteIdFromSocketSpy.calledOnce)

      assert(failConnectionStub.called === false)
      assert(updateUserDataStub.calledOnce)
      assert(startConnectionStub.calledOnce)
      assert(mockSocket.on.callCount === 11)
    })
  })

  describe('checkViewPermission', function () {
    // role -> guest, loggedInUser, loggedInOwner
    const viewPermission = {
      freely: [true, true, true],
      editable: [true, true, true],
      limited: [false, true, true],
      locked: [true, true, true],
      protected: [false, true, true],
      private: [false, false, true]
    }
    const loggedInUserId = 'user1_id'
    const ownerUserId = 'user2_id'
    const guestReq = {}
    const loggedInUserReq = {
      user: {
        id: loggedInUserId,
        logged_in: true
      }
    }
    const loggedInOwnerReq = {
      user: {
        id: ownerUserId,
        logged_in: true
      }
    }

    const note = {
      owner: ownerUserId
    }

    let realtime

    beforeEach(() => {
      mock('../../lib/logger', {
        error: () => {
        }
      })
      mock('../../lib/history', {})
      mock('../../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../../lib/config', {})
      realtime = require('../../lib/realtime')
    })

    Object.keys(viewPermission).forEach(function (permission) {
      describe(permission, function () {
        beforeEach(() => {
          note.permission = permission
        })
        it('guest permission test', function () {
          assert(realtime.checkViewPermission(guestReq, note) === viewPermission[permission][0])
        })
        it('loggedIn User permission test', function () {
          assert(realtime.checkViewPermission(loggedInUserReq, note) === viewPermission[permission][1])
        })
        it('loggedIn Owner permission test', function () {
          assert(realtime.checkViewPermission(loggedInOwnerReq, note) === viewPermission[permission][2])
        })
      })
    })
  })
})
