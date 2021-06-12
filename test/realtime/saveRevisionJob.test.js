/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')
const { removeModuleFromRequireCache, removeLibModuleCache } = require('./utils')

describe('save revision job', function () {
  let clock
  let mockModels
  let realtime
  beforeEach(() => {
    removeLibModuleCache()
    mockModels = {
      Revision: {
        saveAllNotesRevision: sinon.stub()
      }
    }
    clock = sinon.useFakeTimers()
    mock('../../dist/processQueue', require('../testDoubles/ProcessQueueFake'))
    mock('../../dist/logger', {
      error: () => {},
      info: () => {}
    })
    mock('../../dist/history', {})
    mock('../../dist/models', mockModels)
    mock('../../dist/config', {
      debug: true
    })
    mock('../../dist/realtimeUpdateDirtyNoteJob', require('../testDoubles/realtimeJobStub'))
    mock('../../dist/realtimeCleanDanglingUserJob', require('../testDoubles/realtimeJobStub'))
  })

  afterEach(() => {
    clock.restore()
    removeModuleFromRequireCache('../../dist/realtime/realtime')
    removeModuleFromRequireCache('../../dist/realtime/realtimeSaveRevisionJob')
    mock.stopAll()
    sinon.restore()
  })

  it('should execute save revision job every 5 min', (done) => {
    mockModels.Revision.saveAllNotesRevision.callsFake((callback) => {
      callback(null, [])
    })
    realtime = require('../../dist/realtime/realtime')
    clock.tick(5 * 60 * 1000)
    clock.restore()
    setTimeout(() => {
      assert(mockModels.Revision.saveAllNotesRevision.called)
      assert(realtime.saveRevisionJob.getSaverSleep() === true)
      done()
    }, 50)
  })

  it('should not set saverSleep when more than 1 note save revision', (done) => {
    mockModels.Revision.saveAllNotesRevision.callsFake((callback) => {
      callback(null, [1])
    })
    realtime = require('../../dist/realtime/realtime')
    clock.tick(5 * 60 * 1000)
    clock.restore()
    setTimeout(() => {
      assert(mockModels.Revision.saveAllNotesRevision.called)
      assert(realtime.saveRevisionJob.getSaverSleep() === false)
      done()
    }, 50)
  })
})
