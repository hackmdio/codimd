/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const sinon = require('sinon')

const { ProcessQueue } = require('../lib/realtime/processQueue')

describe('ProcessQueue', function () {
  let clock
  const waitTimeForCheckResult = 50

  beforeEach(() => {
    clock = sinon.useFakeTimers({
      toFake: ['setInterval']
    })
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
  })

  it('should not accept more than maximum task', () => {
    const queue = new ProcessQueue({ maximumLength: 2 })

    queue.start()
    assert(queue.push(1, () => (Promise.resolve())))
    assert(queue.push(1, () => (Promise.resolve())) === false)
  })

  it('should run task every interval', (done) => {
    const runningClock = []
    const queue = new ProcessQueue({ maximumLength: 2 })
    const task = async () => {
      runningClock.push(clock.now)
    }
    queue.start()
    assert(queue.push(1, task))
    assert(queue.push(2, task))
    clock.tick(5)
    setTimeout(() => {
      clock.tick(5)
    }, 1)
    setTimeout(() => {
      clock.tick(5)
    }, 2)
    setTimeout(() => {
      clock.tick(5)
    }, 3)

    setTimeout(() => {
      queue.stop()
      assert(runningClock.length === 2)
      done()
    }, waitTimeForCheckResult)
  })

  it('should not crash when repeat stop queue', () => {
    const queue = new ProcessQueue({ maximumLength: 2, triggerTimeInterval: 10 })
    try {
      queue.stop()
      queue.stop()
      queue.stop()
      assert.ok(true)
    } catch (e) {
      assert.fail(e)
    }
  })

  it('should run process when queue is empty', (done) => {
    const queue = new ProcessQueue({ maximumLength: 2, triggerTimeInterval: 100 })
    const processSpy = sinon.spy(queue, 'process')
    queue.start()
    clock.tick(100)
    setTimeout(() => {
      assert(processSpy.called)
      done()
    }, waitTimeForCheckResult)
  })

  it('should run process although error occurred', (done) => {
    const queue = new ProcessQueue({ maximumLength: 2, triggerTimeInterval: 100 })
    const failedTask = sinon.spy(async () => {
      throw new Error('error')
    })
    const normalTask = sinon.spy(async () => {
    })
    queue.start()
    assert(queue.push(1, failedTask))
    assert(queue.push(2, normalTask))
    clock.tick(100)
    setTimeout(() => {
      clock.tick(100)
    }, 1)
    setTimeout(() => {
      // assert(queue.queue.length === 0)
      assert(failedTask.called)
      assert(normalTask.called)
      done()
    }, waitTimeForCheckResult)
  })

  it('should ignore trigger when event not complete', (done) => {
    const queue = new ProcessQueue({ maximumLength: 2, triggerTimeInterval: 10 })
    const processSpy = sinon.spy(queue, 'process')
    const longTask = async () => {
      return new Promise((resolve) => {
        setInterval(() => {
          resolve()
        }, 50)
      })
    }
    queue.start()
    queue.push(1, longTask)
    clock.tick(10)
    setTimeout(() => {
      clock.tick(10)
    }, 0)
    setTimeout(() => {
      clock.tick(10)
    }, 1)
    setTimeout(() => {
      assert(processSpy.callCount === 1)
      assert(processSpy.calledOnce)
      done()
    }, waitTimeForCheckResult)
  })
})
