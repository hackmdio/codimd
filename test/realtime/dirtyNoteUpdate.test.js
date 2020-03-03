/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')
const { removeModuleFromRequireCache, makeMockSocket, removeLibModuleCache } = require('./utils')

describe('realtime#update note is dirty timer', function () {
  let realtime
  let clock

  beforeEach(() => {
    removeLibModuleCache()
    clock = sinon.useFakeTimers({
      toFake: ['setInterval']
    })
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

    realtime.io = {
      to: sinon.stub().callsFake(function () {
        return {
          emit: sinon.fake()
        }
      })
    }
  })

  afterEach(() => {
    removeModuleFromRequireCache('../../lib/realtime/realtimeUpdateDirtyNoteJob')
    removeModuleFromRequireCache('../../lib/realtime/realtime')
    mock.stopAll()
    clock.restore()
  })

  it('should update note when note is dirty', (done) => {
    sinon.stub(realtime, 'updateNote').callsFake(function (note, callback) {
      callback(null, note)
    })

    realtime.notes['note1'] = {
      server: {
        isDirty: false
      },
      socks: []
    }

    const note2 = {
      server: {
        isDirty: true
      },
      socks: []
    }

    realtime.notes['note2'] = note2

    clock.tick(1000)
    setTimeout(() => {
      assert(note2.server.isDirty === false)
      done()
    }, 10)
  })

  it('should not do anything when note missing', function (done) {
    sinon.stub(realtime, 'updateNote').callsFake(function (note, callback) {
      delete realtime.notes['note']
      callback(null, note)
    })

    const note = {
      server: {
        isDirty: true
      },
      socks: [makeMockSocket()]
    }
    realtime.notes['note'] = note

    clock.tick(1000)

    setTimeout(() => {
      assert(note.server.isDirty === false)
      assert(note.socks[0].disconnect.called === false)
      done()
    }, 50)
  })

  it('should disconnect all clients when update note error', function (done) {
    sinon.stub(realtime, 'updateNote').callsFake(function (note, callback) {
      callback(new Error('some error'), null)
    })

    realtime.io = {
      to: sinon.stub().callsFake(function () {
        return {
          emit: sinon.fake()
        }
      })
    }

    const note = {
      server: {
        isDirty: true
      },
      socks: [makeMockSocket(), undefined, makeMockSocket()]
    }
    realtime.notes['note'] = note

    clock.tick(1000)

    setTimeout(() => {
      assert(note.server.isDirty === false)
      assert(note.socks[0].disconnect.called)
      assert(note.socks[2].disconnect.called)
      done()
    }, 50)
  })
})
