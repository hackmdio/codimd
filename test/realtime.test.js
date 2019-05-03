'use strict'

/* eslint-env node, mocha */

const mock = require('mock-require')
const assert = require('assert')
const sinon = require('sinon')

function makeMockSocket (headers, query) {
  return {
    id: Math.round(Math.random() * 10000),
    handshake: {
      headers: Object.assign({}, headers),
      query: Object.assign({}, query)
    },
    on: sinon.fake()
  }
}

function removeModuleFromRequireCache (modulePath) {
  delete require.cache[require.resolve(modulePath)]
}

describe('realtime', function () {
  describe('extractNoteIdFromSocket', function () {
    beforeEach(() => {
      mock('../lib/logger', {})
      mock('../lib/history', {})
      mock('../lib/models', {})
    })

    afterEach(() => {
      delete require.cache[require.resolve('../lib/realtime')]
      mock.stopAll()
    })

    describe('urlPath not set', function () {
      beforeEach(() => {
        mock('../lib/config', {})
        realtime = require('../lib/realtime')
      })

      let realtime

      it('return false if socket or socket.handshake not exists', function () {
        let noteId = realtime.extractNoteIdFromSocket()
        assert.strictEqual(false, noteId)

        noteId = realtime.extractNoteIdFromSocket({})
        assert.strictEqual(false, noteId)
      })

      it('return false if query not set and referer not set', function () {
        let noteId = realtime.extractNoteIdFromSocket(makeMockSocket({
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
        mock('../lib/config', {
          urlPath: urlPath
        })
        realtime = require('../lib/realtime')
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

  describe('parseNoteIdFromSocket', function () {
    let realtime

    beforeEach(() => {
      mock('../lib/logger', {})
      mock('../lib/history', {})
      mock('../lib/models', {
        Note: {
          parseNoteId: function (noteId, callback) {
            callback(null, noteId)
          }
        }
      })
      mock('../lib/config', {})
    })

    afterEach(() => {
      removeModuleFromRequireCache('../lib/realtime')
      mock.stopAll()
    })

    it('should return null when socket not send noteId', function () {
      realtime = require('../lib/realtime')
      const mockSocket = makeMockSocket()
      const fakeCallback = sinon.fake()
      realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
      assert(fakeCallback.called)
      assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, null])
    })

    describe('noteId exists', function () {
      beforeEach(() => {
        mock('../lib/models', {
          Note: {
            parseNoteId: function (noteId, callback) {
              callback(null, noteId)
            }
          }
        })
      })
      it('should return noteId when noteId exists', function () {
        realtime = require('../lib/realtime')
        const noteId = '123456'
        const mockSocket = makeMockSocket(undefined, {
          noteId: noteId
        })
        realtime = require('../lib/realtime')
        const fakeCallback = sinon.fake()
        realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
        assert(fakeCallback.called)
        assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, noteId])
      })
    })

    describe('noteId not exists', function () {
      beforeEach(() => {
        mock('../lib/models', {
          Note: {
            parseNoteId: function (noteId, callback) {
              callback(null, null)
            }
          }
        })
      })
      it('should return null when noteId not exists', function () {
        realtime = require('../lib/realtime')
        const noteId = '123456'
        const mockSocket = makeMockSocket(undefined, {
          noteId: noteId
        })
        realtime = require('../lib/realtime')
        const fakeCallback = sinon.fake()
        realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
        assert(fakeCallback.called)
        assert.deepStrictEqual(fakeCallback.getCall(0).args, [null, null])
      })
    })

    describe('parse note error', function () {
      beforeEach(() => {
        mock('../lib/models', {
          Note: {
            parseNoteId: function (noteId, callback) {
              /* eslint-disable-next-line */
              callback('error', null)
            }
          }
        })
      })
      it('should return error when noteId parse error', function () {
        realtime = require('../lib/realtime')
        const noteId = '123456'
        const mockSocket = makeMockSocket(undefined, {
          noteId: noteId
        })
        realtime = require('../lib/realtime')
        const fakeCallback = sinon.fake()
        realtime.parseNoteIdFromSocket(mockSocket, fakeCallback)
        assert(fakeCallback.called)
        assert.deepStrictEqual(fakeCallback.getCall(0).args, ['error', null])
      })
    })
  })

  describe('update note is dirty timer', function () {
    let realtime
    beforeEach(() => {
      mock('../lib/logger', {
        error: () => {
        }
      })
      mock('../lib/history', {})
      mock('../lib/models', {
        Revision: {
          saveAllNotesRevision: () => {
          }
        }
      })
      mock('../lib/config', {})
    })

    afterEach(() => {
      removeModuleFromRequireCache('../lib/realtime')
      mock.stopAll()
    })

    it('should update note when note is dirty', (done) => {
      const clock = sinon.useFakeTimers()
      realtime = require('../lib/realtime')
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
      mock('../lib/logger', {
        error: () => {
        }
      })
      mock('../lib/history', {})
      mock('../lib/models', {
        Note: {
          findOne: async function () {
            return fakeNote
          }
        }
      })
      mock('../lib/config', {})
    })

    afterEach(() => {
      mock.stopAll()
    })

    it('should return null when note not found', function (done) {
      fakeNote = null
      realtime = require('../lib/realtime')

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
      mock('../lib/logger', {})
      mock('../lib/history', {})
      mock('../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../lib/config', {})
      realtime = require('../lib/realtime')
    })

    afterEach(() => {
      removeModuleFromRequireCache('../lib/realtime')
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
      mock('../lib/logger', {
        error: () => {
        }
      })
      mock('../lib/history', {})
      mock('../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../lib/config', {})
      realtime = require('../lib/realtime')
    })

    afterEach(() => {
      removeModuleFromRequireCache('../lib/realtime')
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

  describe('socket event', function () {
    let realtime
    const noteId = "note123"
    let clientSocket
    const eventFuncMap = new Map()
    beforeEach(() => {
      mock('../lib/logger', {
        error: () => {
        }
      })
      mock('../lib/history', {})
      mock('../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../lib/config', {})
      realtime = require('../lib/realtime')

      // get all socket event handler
      clientSocket = makeMockSocket()
      clientSocket.on = function (event, func) {
        eventFuncMap.set(event, func)
      }
      realtime.maintenance = false
      sinon.stub(realtime, 'parseNoteIdFromSocket').callsFake((socket, callback) => {
        /* eslint-disable-next-line */
        callback(null, noteId)
      })
      sinon.stub(realtime, 'failConnection')
      sinon.stub(realtime, 'updateUserData')
      sinon.stub(realtime, 'startConnection')
      realtime.connection(clientSocket)
    })

    afterEach(() => {
      removeModuleFromRequireCache('../lib/realtime')
      mock.stopAll()
      sinon.restore()
    })

    describe('refresh', function () {
      it('should call refresh', () => {
        const refreshFunc = eventFuncMap.get('refresh')
        const emitRefreshStub = sinon.stub(realtime, 'emitRefresh')
        refreshFunc()
        assert(emitRefreshStub.calledOnce)
        assert.deepStrictEqual(emitRefreshStub.lastCall.args[0], clientSocket)
      })
    })

    describe('user status', function () {
      it('should call emitUserStatus and update user data', () => {
        const userStatusFunc = eventFuncMap.get('user status')
        const emitUserStatusStub = sinon.stub(realtime, 'emitUserStatus')
        realtime.notes[noteId] = {}

        const userData = {
          idle: true,
          type: 'xs'
        }
        userStatusFunc(userData)
        assert(emitUserStatusStub.calledOnce)
        assert.deepStrictEqual(emitUserStatusStub.lastCall.args[0], clientSocket)
        assert(realtime.users[clientSocket.id].idle === true)
        assert(realtime.users[clientSocket.id].type === 'xs')
      })

      it('should call emitUserStatus without userdata', () => {
        const userStatusFunc = eventFuncMap.get('user status')
        const emitUserStatusStub = sinon.stub(realtime, 'emitUserStatus')
        realtime.notes[noteId] = {}
        userStatusFunc()
        assert(emitUserStatusStub.calledOnce)
        assert.deepStrictEqual(emitUserStatusStub.lastCall.args[0], clientSocket)
        assert(realtime.users[clientSocket.id].idle === false)
        assert(realtime.users[clientSocket.id].type === null)
      })

      it('should not call emitUserStatus when user not exists', () => {
        const userStatusFunc = eventFuncMap.get('user status')
        const emitUserStatusStub = sinon.stub(realtime, 'emitUserStatus')
        realtime.notes[noteId] = {}
        delete realtime.users[clientSocket.id]
        const userData = {
          idle: true,
          type: 'xs'
        }
        userStatusFunc(userData)
        assert(emitUserStatusStub.called === false)
      })

      it('should not call emitUserStatus when note not exists', () => {
        const userStatusFunc = eventFuncMap.get('user status')
        const emitUserStatusStub = sinon.stub(realtime, 'emitUserStatus')
        realtime.notes = {}
        realtime.users[clientSocket.id] = {}
        const userData = {
          idle: true,
          type: 'xs'
        }
        userStatusFunc(userData)
        assert(emitUserStatusStub.called === false)
      })

    })

    describe('disconnect', function () {
      it('should push socket to disconnect queue and call disconnect function', () => {
        const disconnectFunc = eventFuncMap.get('disconnect')
        const disconnectStub = sinon.stub(realtime, 'disconnect')
        disconnectFunc()
        assert(realtime.disconnectSocketQueue.length === 1)
        assert(disconnectStub.calledOnce)
      })

      it('should quick return when socket is in disconnect queue', () => {
        const disconnectFunc = eventFuncMap.get('disconnect')
        const disconnectStub = sinon.stub(realtime, 'disconnect')
        realtime.disconnectSocketQueue.push(clientSocket)
        disconnectFunc()
        assert(disconnectStub.called === false)
      })

    })

  })

})
