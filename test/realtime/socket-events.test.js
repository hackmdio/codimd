/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { makeMockSocket, removeModuleFromRequireCache } = require('./utils')

describe('realtime#socket event', function () {
  const noteId = 'note123'
  let realtime
  let clientSocket
  let modelsMock
  let eventFuncMap

  beforeEach(function () {
    eventFuncMap = new Map()
    modelsMock = {
      Note: {
        parseNoteTitle: (data) => (data),
        destroy: sinon.stub().returns(Promise.resolve(1))
      }
    }
    mock('../../lib/logger', {
      error: () => {
      },
      info: () => {
      }
    })
    mock('../../lib/history', {})
    mock('../../lib/models', modelsMock)
    mock('../../lib/config', {
      fullversion: '1.5.0',
      minimumCompatibleVersion: '1.0.0'
    })
    realtime = require('../../lib/realtime')

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
    const wrappedFuncs = []
    wrappedFuncs.push(sinon.stub(realtime, 'failConnection'))
    wrappedFuncs.push(sinon.stub(realtime, 'updateUserData'))
    wrappedFuncs.push(sinon.stub(realtime, 'startConnection'))
    realtime.connection(clientSocket)

    wrappedFuncs.forEach((wrappedFunc) => {
      wrappedFunc.restore()
    })
  })

  afterEach(function () {
    removeModuleFromRequireCache('../../lib/realtime')
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

  ;['cursor focus', 'cursor activity', 'cursor blur'].forEach((event) => {
    describe(event, function () {
      let cursorFocusFunc

      const cursorData = {
        cursor: 10
      }

      beforeEach(() => {
        cursorFocusFunc = eventFuncMap.get(event)
        realtime.notes[noteId] = {}
      })

      it('should broadcast to all client', () => {
        cursorFocusFunc(cursorData)
        const broadChannelEmitFake = clientSocket.broadcast.to(noteId).emit
        assert(broadChannelEmitFake.calledOnce)
        assert(broadChannelEmitFake.lastCall.args[0] === event)
        if (event === 'cursor blur') {
          assert(broadChannelEmitFake.lastCall.args[1].id === clientSocket.id)
        } else {
          assert.deepStrictEqual(broadChannelEmitFake.lastCall.args[1].cursor, cursorData)
        }
      })

      it('should not broadcast when note not exists', () => {
        delete realtime.notes[noteId]
        cursorFocusFunc(cursorData)
        const broadChannelEmitFake = clientSocket.broadcast.to(noteId).emit
        assert(broadChannelEmitFake.called === false)
      })

      it('should not broadcast when user not exists', () => {
        delete realtime.users[clientSocket.id]
        cursorFocusFunc(cursorData)
        const broadChannelEmitFake = clientSocket.broadcast.to(noteId).emit
        assert(broadChannelEmitFake.called === false)
      })
    })
  })

  describe('version', function () {
    it('should emit server version ', () => {
      const versionFunc = eventFuncMap.get('version')
      versionFunc()
      assert(clientSocket.emit.called)
      assert(clientSocket.emit.lastCall.args[0], 'version')
      assert.deepStrictEqual(clientSocket.emit.lastCall.args[1], {
        version: '1.5.0',
        minimumCompatibleVersion: '1.0.0'
      })
    })
  })

  describe('online users', function () {
    it('should return online user list', function () {
      const onlineUsersFunc = eventFuncMap.get('online users')
      realtime.notes[noteId] = {
        users: {
          10: {
            id: 10
          },
          20: {
            id: 20
          }
        }
      }
      onlineUsersFunc()
      assert(clientSocket.emit.called)
      assert(clientSocket.emit.lastCall.args[0] === 'online users')
      let returnUserList = clientSocket.emit.lastCall.args[1].users
      assert(returnUserList.length === 2)
      assert(returnUserList[0].id === 10)
      assert(returnUserList[1].id === 20)
    })

    it('should not return user list when note not exists', function () {
      const onlineUsersFunc = eventFuncMap.get('online users')
      onlineUsersFunc()
      assert(clientSocket.emit.called === false)
    })
  })

  describe('user changed', function () {
    it('should call updateUserData', () => {
      const userChangedFunc = eventFuncMap.get('user changed')
      realtime.notes[noteId] = {
        users: {
          [clientSocket.id]: {}
        }
      }
      const updateUserDataStub = sinon.stub(realtime, 'updateUserData')
      const emitOnlineUsersStub = sinon.stub(realtime, 'emitOnlineUsers')
      userChangedFunc()
      assert(updateUserDataStub.calledOnce)
      assert(emitOnlineUsersStub.calledOnce)
    })

    it('should direct return when note not exists', function () {
      const userChangedFunc = eventFuncMap.get('user changed')
      const updateUserDataStub = sinon.stub(realtime, 'updateUserData')
      const emitOnlineUsersStub = sinon.stub(realtime, 'emitOnlineUsers')
      userChangedFunc()
      assert(updateUserDataStub.called === false)
      assert(emitOnlineUsersStub.called === false)
    })

    it('should direct return when note not exists', function () {
      const userChangedFunc = eventFuncMap.get('user changed')
      realtime.notes[noteId] = {
        users: {}
      }
      delete realtime.users[clientSocket.id]
      const updateUserDataStub = sinon.stub(realtime, 'updateUserData')
      const emitOnlineUsersStub = sinon.stub(realtime, 'emitOnlineUsers')
      userChangedFunc()
      assert(updateUserDataStub.called === false)
      assert(emitOnlineUsersStub.called === false)
    })
  })
})
