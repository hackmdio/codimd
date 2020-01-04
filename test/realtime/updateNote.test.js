/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { removeLibModuleCache } = require('./utils')
const { createFakeLogger } = require('../testDoubles/loggerFake')
const realtimeJobStub = require('../testDoubles/realtimeJobStub')

describe('realtime#updateNote', function () {
  let modelsStub
  let realtime
  const now = 1546300800000
  let clock

  beforeEach(() => {
    removeLibModuleCache()
    clock = sinon.useFakeTimers({
      now,
      toFake: ['Date']
    })
    modelsStub = {
      Note: {
        findOne: sinon.stub()
      },
      User: {
        findOne: sinon.stub()
      }
    }

    mock('../../lib/config', {})
    mock('../../lib/logger', createFakeLogger())
    mock('../../lib/models', modelsStub)
    mock('../../lib/realtimeUpdateDirtyNoteJob', realtimeJobStub)
    mock('../../lib/realtimeCleanDanglingUserJob', realtimeJobStub)
    // mock('../../lib/realtimeSaveRevisionJob', realtimeJobStub)
  })

  afterEach(() => {
    mock.stopAll()
    clock.restore()
    sinon.restore()
    removeLibModuleCache()
  })

  it('should save history to each edited user', function (done) {
    modelsStub.Note.findOne.returns(Promise.resolve({}))
    realtime = require('../../lib/realtime/realtime')
    const updateHistoryStub = sinon.stub(realtime, 'updateHistory')

    const callback = sinon.stub()
    const note = {
      tempUsers: {
        user1: Date.now()
      }
    }
    realtime.updateNote(note, callback)
    clock.restore()
    setTimeout(() => {
      assert(updateHistoryStub.calledOnce)
      assert(updateHistoryStub.lastCall.calledWith('user1', note, now))
      done()
    }, 50)
  })

  it('should set lastchangeprofile when lastchangeuser is set', function (done) {
    const callback = sinon.stub()

    const note = {
      lastchangeuser: 'user1'
    }

    modelsStub.Note.findOne.returns(Promise.resolve({}))

    modelsStub.User.findOne.withArgs({
      where: {
        id: 'user1'
      }
    }).returns(Promise.resolve({
      id: 'user1',
      profile: '{ "displayName": "User 01" }'
    }))
    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })

    realtime = require('../../lib/realtime/realtime')

    realtime.updateNote(note, callback)
    clock.restore()
    setTimeout(() => {
      assert(note.lastchangeuserprofile.name === 'User 01')
      done()
    }, 50)
  })

  it('should save note with new data', function (done) {
    const callback = sinon.stub()
    const note = {
      lastchangeuser: 'user1',
      server: {
        document: '# title\n\n## test2'
      },
      authorship: []
    }

    modelsStub.Note.parseNoteTitle = sinon.stub().returns('title')
    const updateNoteStub = sinon.stub().returns(Promise.resolve({}))
    modelsStub.Note.findOne.returns(Promise.resolve({
      update: updateNoteStub
    }))

    modelsStub.User.findOne.withArgs({
      where: {
        id: 'user1'
      }
    }).returns(Promise.resolve({
      id: 'user1',
      profile: '{ "displayName": "User 01" }'
    }))
    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })
    clock.tick(1000)

    realtime = require('../../lib/realtime/realtime')
    realtime.updateNote(note, callback)
    setTimeout(() => {
      assert(note.lastchangeuserprofile.name === 'User 01')
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === null)
      assert(updateNoteStub.calledOnce)
      assert(updateNoteStub.lastCall.args[0].lastchangeAt === now + 1000)
      assert(updateNoteStub.lastCall.args[0].title === 'title')
      assert(updateNoteStub.lastCall.args[0].content === '# title\n\n## test2')
      done()
    }, 50)
  })

  it('should save note when lsatChangeUser is guest', function (done) {
    const callback = sinon.stub()
    const note = {
      server: {
        document: '# title\n\n## test2'
      },
      authorship: []
    }

    modelsStub.Note.parseNoteTitle = sinon.stub().returns('title')
    const updateNoteStub = sinon.stub().returns(Promise.resolve({}))
    modelsStub.Note.findOne.returns(Promise.resolve({
      update: updateNoteStub
    }))

    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })
    clock.tick(1000)

    realtime = require('../../lib/realtime/realtime')
    realtime.updateNote(note, callback)
    setTimeout(() => {
      assert(modelsStub.User.findOne.callCount === 0)
      assert(note.lastchangeuserprofile === null)
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === null)
      assert(updateNoteStub.calledOnce)
      assert(updateNoteStub.lastCall.args[0].lastchangeAt === now + 1000)
      assert(updateNoteStub.lastCall.args[0].title === 'title')
      assert(updateNoteStub.lastCall.args[0].content === '# title\n\n## test2')
      done()
    }, 50)
  })

  it('should save note when lastChangeUser as same as database', function (done) {
    const callback = sinon.stub()
    const note = {
      lastchangeuser: 'user1',
      server: {
        document: '# title\n\n## test2'
      },
      authorship: []
    }

    modelsStub.Note.parseNoteTitle = sinon.stub().returns('title')
    const updateNoteStub = sinon.stub().returns(Promise.resolve({}))
    modelsStub.Note.findOne.returns(Promise.resolve({
      update: updateNoteStub,
      lastchangeuserId: 'user1'
    }))

    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })
    clock.tick(1000)

    realtime = require('../../lib/realtime/realtime')
    realtime.updateNote(note, callback)
    setTimeout(() => {
      assert(modelsStub.User.findOne.callCount === 0)
      assert(modelsStub.User.getProfile.callCount === 0)
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === null)
      assert(updateNoteStub.calledOnce)
      assert(updateNoteStub.lastCall.args[0].lastchangeAt === now + 1000)
      assert(updateNoteStub.lastCall.args[0].lastchangeuserId === 'user1')
      assert(updateNoteStub.lastCall.args[0].title === 'title')
      assert(updateNoteStub.lastCall.args[0].content === '# title\n\n## test2')
      done()
    }, 50)
  })

  it('should not save note when lastChangeUser not found in database', function (done) {
    const callback = sinon.stub()
    const note = {
      lastchangeuser: 'user1',
      server: {
        document: '# title\n\n## test2'
      },
      authorship: []
    }

    modelsStub.Note.parseNoteTitle = sinon.stub().returns('title')
    const updateNoteStub = sinon.stub().returns(Promise.resolve({}))
    modelsStub.Note.findOne.returns(Promise.resolve({
      update: updateNoteStub
    }))
    modelsStub.User.findOne.returns(Promise.resolve(null))
    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })
    clock.tick(1000)

    realtime = require('../../lib/realtime/realtime')
    realtime.updateNote(note, callback)
    setTimeout(() => {
      assert(modelsStub.User.findOne.called)
      assert(modelsStub.User.getProfile.callCount === 0)
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === null)
      assert(callback.lastCall.args[1] === null)
      assert(updateNoteStub.callCount === 0)
      done()
    }, 50)
  })

  it('should not save note when note.server not exists', function (done) {
    const callback = sinon.stub()
    const note = {
      lastchangeuser: 'user1',
      authorship: []
    }

    modelsStub.Note.parseNoteTitle = sinon.stub().returns('title')
    const updateNoteStub = sinon.stub().returns(Promise.resolve({}))
    modelsStub.Note.findOne.returns(Promise.resolve({
      update: updateNoteStub
    }))

    modelsStub.User.findOne.withArgs({
      where: {
        id: 'user1'
      }
    }).returns(Promise.resolve({
      id: 'user1',
      profile: '{ "displayName": "User 01" }'
    }))
    modelsStub.User.getProfile = sinon.stub().returns({
      name: 'User 01'
    })
    clock.tick(1000)

    realtime = require('../../lib/realtime/realtime')
    realtime.updateNote(note, callback)
    setTimeout(() => {
      assert(note.lastchangeuserprofile.name === 'User 01')
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === null)
      assert(callback.lastCall.args[1] === null)
      assert(updateNoteStub.callCount === 0)
      done()
    }, 50)
  })
})
