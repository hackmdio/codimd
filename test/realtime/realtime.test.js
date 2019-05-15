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
