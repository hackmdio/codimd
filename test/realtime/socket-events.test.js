/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { makeMockSocket, removeModuleFromRequireCache } = require('./utils')

describe('realtime#socket event', function () {
  const noteId = 'note123'
  const note = {
    id: noteId,
    authors: [
      {
        userId: 'user1',
        color: 'red',
        user: {
          id: 'user1',
          name: 'Alice'
        }
      },
      {
        userId: 'user2',
        color: 'blue',
        user: {
          id: 'user2',
          name: 'Bob'
        }
      }
    ]
  }
  let realtime
  let clientSocket
  let modelsMock
  let eventFuncMap
  let configMock
  let clock

  beforeEach(function (done) {
    clock = sinon.useFakeTimers({
      toFake: ['setInterval']
    })
    eventFuncMap = new Map()
    modelsMock = {
      Note: {
        parseNoteTitle: (data) => (data),
        destroy: sinon.stub().returns(Promise.resolve(1)),
        update: sinon.stub().returns(Promise.resolve([1])),
        findOne: sinon.stub().returns(Promise.resolve(note))
      },
      User: {}
    }
    modelsMock.User.getProfile = sinon.stub().callsFake((user) => {
      return user
    })
    configMock = {
      fullversion: '1.5.0',
      minimumCompatibleVersion: '1.0.0',
      permission: {
        freely: 'freely',
        editable: 'editable',
        limited: 'limited',
        locked: 'locked',
        protected: 'protected',
        private: 'private'
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
    mock('../../lib/config', configMock)
    mock('../../lib/ot', require('../testDoubles/otFake'))
    realtime = require('../../lib/realtime/realtime')

    // get all socket event handler
    clientSocket = makeMockSocket(null, {
      noteId: noteId
    })
    clientSocket.request.user.logged_in = true
    clientSocket.request.user.id = 'user1'
    // clientSocket.noteId = noteId
    clientSocket.on = function (event, func) {
      eventFuncMap.set(event, func)
    }
    realtime.maintenance = false

    realtime.io = (function () {
      const roomMap = new Map()
      return {
        to: function (roomId) {
          if (!roomMap.has(roomId)) {
            roomMap.set(roomId, {
              emit: sinon.stub()
            })
          }
          return roomMap.get(roomId)
        }
      }
    }())

    const wrappedFuncs = []
    wrappedFuncs.push(sinon.stub(realtime, 'updateUserData'))
    wrappedFuncs.push(sinon.stub(realtime, 'emitOnlineUsers'))
    wrappedFuncs.push(sinon.stub(realtime, 'parseNoteIdFromSocketAsync').returns(Promise.resolve(noteId)))
    wrappedFuncs.push(sinon.stub(realtime, 'updateHistory'))
    wrappedFuncs.push(sinon.stub(realtime, 'emitRefresh'))

    realtime.connection(clientSocket)

    setTimeout(() => {
      wrappedFuncs.forEach((wrappedFunc) => {
        wrappedFunc.restore()
      })
      done()
    }, 50)
  })

  afterEach(function () {
    removeModuleFromRequireCache('../../lib/realtime/realtime')
    removeModuleFromRequireCache('../../lib/realtime/realtimeClientConnection')
    mock.stopAll()
    sinon.restore()
    clock.restore()
    clientSocket = null
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
      realtime.deleteAllNoteFromPool()
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
      const queueForDisconnectStub = sinon.stub(realtime, 'queueForDisconnect')
      disconnectFunc()
      assert(queueForDisconnectStub.calledOnce)
    })

    it('should quick return when socket is in disconnect queue', () => {
      const disconnectFunc = eventFuncMap.get('disconnect')
      const queueForDisconnectStub = sinon.stub(realtime, 'queueForDisconnect')
      realtime.disconnectProcessQueue.push(clientSocket.id, async () => {})
      disconnectFunc()
      assert(queueForDisconnectStub.called === false)
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
      const returnUserList = clientSocket.emit.lastCall.args[1].users
      assert(returnUserList.length === 2)
      assert(returnUserList[0].id === 10)
      assert(returnUserList[1].id === 20)
    })

    it('should not return user list when note not exists', function () {
      const onlineUsersFunc = eventFuncMap.get('online users')
      realtime.deleteAllNoteFromPool()
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
      realtime.deleteAllNoteFromPool()
      userChangedFunc()
      assert(updateUserDataStub.called === false)
      assert(emitOnlineUsersStub.called === false)
    })

    it('should direct return when note\'s users not exists', function () {
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

  describe('delete', function () {
    it('should delete note when owner request', function (done) {
      const currentUserId = 'user1_id'
      const noteOwnerId = 'user1_id'
      const otherClient = makeMockSocket()
      clientSocket.request = {
        user: {
          logged_in: true,
          id: currentUserId
        }
      }
      realtime.notes[noteId] = {
        owner: noteOwnerId,
        socks: [clientSocket, undefined, otherClient]
      }
      const deleteFunc = eventFuncMap.get('delete')
      deleteFunc()
      setTimeout(() => {
        assert(otherClient.disconnect.calledOnce)
        assert(otherClient.emit.calledOnce)
        assert(otherClient.emit.lastCall.args[0] === 'delete')
        assert(clientSocket.disconnect.calledOnce)
        assert(clientSocket.emit.calledOnce)
        assert(clientSocket.emit.lastCall.args[0] === 'delete')
        assert(modelsMock.Note.destroy.calledOnce)
        done()
      }, 10)
    })

    it('should not do anything when user not login', function (done) {
      const noteOwnerId = 'user1_id'
      clientSocket.request = {}
      realtime.notes[noteId] = {
        owner: noteOwnerId,
        socks: [clientSocket]
      }
      const deleteFunc = eventFuncMap.get('delete')
      deleteFunc()
      setTimeout(() => {
        assert(modelsMock.Note.destroy.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 10)
    })

    it('should not do anything when note not exists', function (done) {
      const currentUserId = 'user1_id'
      clientSocket.request = {
        user: {
          logged_in: true,
          id: currentUserId
        }
      }
      const deleteFunc = eventFuncMap.get('delete')
      deleteFunc()
      setTimeout(() => {
        assert(modelsMock.Note.destroy.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 10)
    })

    it('should not do anything when note owner is not me', function (done) {
      const currentUserId = 'user1_id'
      const noteOwnerId = 'user2_id'
      const otherClient = makeMockSocket()
      clientSocket.request = {
        user: {
          logged_in: true,
          id: currentUserId
        }
      }
      realtime.notes[noteId] = {
        owner: noteOwnerId,
        socks: [clientSocket, otherClient]
      }
      const deleteFunc = eventFuncMap.get('delete')
      deleteFunc()
      setTimeout(() => {
        assert(clientSocket.disconnect.called === false)
        assert(modelsMock.Note.destroy.called === false)
        done()
      }, 10)
    })

    it('should not do anything when note destroy fail', function (done) {
      const currentUserId = 'user1_id'
      const noteOwnerId = 'user1_id'
      modelsMock.Note.destroy.withArgs({
        where: {
          id: noteId
        }
      }).returns(Promise.resolve(0))

      const otherClient = makeMockSocket()
      clientSocket.request = {
        user: {
          logged_in: true,
          id: currentUserId
        }
      }
      realtime.notes[noteId] = {
        id: noteId,
        owner: noteOwnerId,
        socks: [clientSocket, otherClient]
      }
      const deleteFunc = eventFuncMap.get('delete')
      deleteFunc()
      setTimeout(() => {
        assert(modelsMock.Note.destroy.calledOnce)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 10)
    })
  })

  describe('permission', function () {
    const ownerId = 'user1_id'
    const otherSignInUserId = 'user2_id'
    let otherClient
    let checkViewPermissionSpy
    let permissionFunc

    beforeEach(function () {
      otherClient = makeMockSocket()
      clientSocket.request = {
        user: {
          id: ownerId,
          logged_in: true
        }
      }

      otherClient.request = {
        user: {
          id: otherSignInUserId,
          logged_in: true
        }
      }

      realtime.deleteAllNoteFromPool()
      realtime.addNote({
        id: noteId,
        owner: ownerId
      })

      checkViewPermissionSpy = sinon.spy(realtime, 'checkViewPermission')
      permissionFunc = eventFuncMap.get('permission')
    })

    it('should disconnect when lose view permission', function (done) {
      realtime.getNoteFromNotePool(noteId).permission = 'editable'
      realtime.getNoteFromNotePool(noteId).socks = [clientSocket, undefined, otherClient]

      permissionFunc('private')

      setTimeout(() => {
        // should change note permission to private
        assert(modelsMock.Note.update.calledOnce)
        assert(modelsMock.Note.update.lastCall.args[0].permission === 'private')
        assert(modelsMock.Note.update.lastCall.args[1].where.id === noteId)
        // should check all connected client
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.calledOnce)
        assert(otherClient.disconnect.calledOnce)
        done()
      }, 5)
    })

    it('should not do anything when user not logged in', function (done) {
      clientSocket.request = {}
      permissionFunc('private')
      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        done()
      }, 5)
    })

    it('should not do anything when note not exists', function (done) {
      delete realtime.notes[noteId]
      permissionFunc('private')
      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        done()
      }, 5)
    })

    it('should not do anything when not note owner', function (done) {
      clientSocket.request.user.id = 'other_user_id'
      permissionFunc('private')
      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        done()
      }, 5)
    })

    it('should change permission to freely when config allowAnonymous, allowAnonymousEdits and allowAnonymousViews are true', function (done) {
      configMock.allowAnonymous = true
      configMock.allowAnonymousEdits = true
      configMock.allowAnonymousViews = true
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.called === false)
        assert(otherClient.disconnect.called === false)
        assert(clientSocket.emit.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 5)
    })

    it('should not change permission to freely when config allowAnonymous, allowAnonymousEdits and allowAnonymousViews are false', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = false
      configMock.allowAnonymousViews = false
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        assert(checkViewPermissionSpy.called === false)
        done()
      }, 5)
    })

    it('should change permission to freely when config allowAnonymous is true', function (done) {
      configMock.allowAnonymous = true
      configMock.allowAnonymousEdits = false
      configMock.allowAnonymousViews = false
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.called === false)
        assert(otherClient.disconnect.called === false)
        assert(clientSocket.emit.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 5)
    })

    it('should not change permission to freely when config allowAnonymousEdits is true', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = true
      configMock.allowAnonymousViews = false
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        assert(checkViewPermissionSpy.called === false)
        done()
      }, 5)
    })

    it('should not change permission to freely when config allowAnonymousViews is true', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = false
      configMock.allowAnonymousViews = true
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(modelsMock.Note.update.called === false)
        assert(checkViewPermissionSpy.called === false)
        done()
      }, 5)
    })

    it('should change permission to editable when config allowAnonymousViews is true', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = false
      configMock.allowAnonymousViews = true
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('editable')

      setTimeout(() => {
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.called === false)
        assert(otherClient.disconnect.called === false)
        assert(clientSocket.emit.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 5)
    })

    it('should change permission to freely when config allowAnonymousEdits and allowAnonymousViews are false true', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = true
      configMock.allowAnonymousViews = true
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('freely')

      setTimeout(() => {
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.called === false)
        assert(otherClient.disconnect.called === false)
        assert(clientSocket.emit.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 5)
    })

    it('should change permission to editable when config allowAnonymousEdits and allowAnonymousViews are false true', function (done) {
      configMock.allowAnonymous = false
      configMock.allowAnonymousEdits = true
      configMock.allowAnonymousViews = true
      realtime.notes[noteId].socks = [clientSocket, undefined, otherClient]

      permissionFunc('editable')

      setTimeout(() => {
        assert(checkViewPermissionSpy.callCount === 2)
        assert(otherClient.emit.called === false)
        assert(otherClient.disconnect.called === false)
        assert(clientSocket.emit.called === false)
        assert(clientSocket.disconnect.called === false)
        done()
      }, 5)
    })
  })
})
