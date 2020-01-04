/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { createFakeLogger } = require('../testDoubles/loggerFake')
const { removeLibModuleCache, makeMockSocket } = require('./utils')
const realtimeJobStub = require('../testDoubles/realtimeJobStub')

describe('realtime#connection', function () {
  describe('connection', function () {
    let realtime
    let modelStub

    beforeEach(() => {
      removeLibModuleCache()
      modelStub = {
        Note: {
          findOne: sinon.stub()
        },
        User: {},
        Author: {}
      }
      mock('../../lib/logger', createFakeLogger())
      mock('../../lib/history', {})
      mock('../../lib/models', modelStub)
      mock('../../lib/config', {})
      mock('../../lib/realtimeUpdateDirtyNoteJob', realtimeJobStub)
      mock('../../lib/realtimeCleanDanglingUserJob', realtimeJobStub)
      mock('../../lib/realtimeSaveRevisionJob', realtimeJobStub)
      mock('../../lib/ot', require('../testDoubles/otFake'))
      realtime = require('../../lib/realtime/realtime')
    })

    afterEach(() => {
      mock.stopAll()
      sinon.restore()
    })

    describe('fail', function () {
      it('should fast return when server not start', () => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = true
        const spy = sinon.spy(realtime, 'parseNoteIdFromSocketAsync')
        realtime.connection(mockSocket)
        assert(!spy.called)
      })

      it('should failed when parse noteId occur error', (done) => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = false
        const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocketAsync').callsFake(async (socket) => {
          /* eslint-disable-next-line */
          throw 'error'
        })

        const failConnectionSpy = sinon.stub(realtime, 'failConnection')

        realtime.connection(mockSocket)

        setTimeout(() => {
          assert(parseNoteIdFromSocketSpy.called)
          assert(failConnectionSpy.calledOnce)
          assert.deepStrictEqual(failConnectionSpy.lastCall.args, [500, 'error', mockSocket])
          done()
        }, 50)
      })

      it('should failed when noteId not exists', (done) => {
        const mockSocket = makeMockSocket()
        realtime.maintenance = false
        const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocketAsync').callsFake(async (socket) => {
          return null
        })

        const failConnectionSpy = sinon.stub(realtime, 'failConnection')

        realtime.connection(mockSocket)

        setTimeout(() => {
          assert(parseNoteIdFromSocketSpy.called)
          assert(failConnectionSpy.calledOnce)
          assert.deepStrictEqual(failConnectionSpy.lastCall.args, [404, 'note id not found', mockSocket])
          done()
        }, 50)
      })
    })

    it('should success connect', function (done) {
      const mockSocket = makeMockSocket()
      const noteId = 'note123'
      realtime.maintenance = false
      const parseNoteIdFromSocketSpy = sinon.stub(realtime, 'parseNoteIdFromSocketAsync').callsFake(async (socket) => {
        return noteId
      })
      const updateUserDataStub = sinon.stub(realtime, 'updateUserData')

      realtime.connection(mockSocket)

      setTimeout(() => {
        assert.ok(parseNoteIdFromSocketSpy.calledOnce)
        assert(updateUserDataStub.calledOnce)
        done()
      }, 50)
    })

    describe('flow', function () {
      it('should establish connection', function (done) {
        const noteId = 'note123'
        const mockSocket = makeMockSocket(null, {
          noteId: noteId
        })
        mockSocket.request.user.logged_in = true
        mockSocket.request.user.id = 'user1'
        mockSocket.noteId = noteId
        realtime.maintenance = false
        sinon.stub(realtime, 'parseNoteIdFromSocketAsync').callsFake(async (socket) => {
          return noteId
        })
        const updateHistoryStub = sinon.stub(realtime, 'updateHistory')
        const emitOnlineUsersStub = sinon.stub(realtime, 'emitOnlineUsers')
        const emitRefreshStub = sinon.stub(realtime, 'emitRefresh')
        const failConnectionSpy = sinon.spy(realtime, 'failConnection')

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
        modelStub.Note.findOne.returns(Promise.resolve(note))
        modelStub.User.getProfile = sinon.stub().callsFake((user) => {
          return user
        })
        sinon.stub(realtime, 'checkViewPermission').returns(true)
        realtime.connection(mockSocket)
        setTimeout(() => {
          assert(modelStub.Note.findOne.calledOnce)
          assert.deepStrictEqual(modelStub.Note.findOne.lastCall.args[0].include, [
            {
              model: modelStub.User,
              as: 'owner'
            }, {
              model: modelStub.User,
              as: 'lastchangeuser'
            }, {
              model: modelStub.Author,
              as: 'authors',
              include: [{
                model: modelStub.User,
                as: 'user'
              }]
            }
          ])
          assert(modelStub.Note.findOne.lastCall.args[0].where.id === noteId)
          assert(updateHistoryStub.calledOnce)
          assert(emitOnlineUsersStub.calledOnce)
          assert(emitRefreshStub.calledOnce)
          assert(failConnectionSpy.callCount === 0)
          assert(realtime.getNotePool()[noteId].id === noteId)
          assert(realtime.getNotePool()[noteId].socks.length === 1)
          assert.deepStrictEqual(realtime.getNotePool()[noteId].authors, {
            user1: {
              userid: 'user1', color: 'red', photo: undefined, name: 'Alice'
            },
            user2: {
              userid: 'user2', color: 'blue', photo: undefined, name: 'Bob'
            }
          })
          assert(Object.keys(realtime.getNotePool()[noteId].users).length === 1)
          done()
        }, 50)
      })
    })
  })
})
