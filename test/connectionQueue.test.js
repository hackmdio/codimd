/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const sinon = require('sinon')

const ConnectionQueuing = require('../lib/connectionQueue').ConnectionQueue

describe('ConnectionQueue', function () {
  let clock

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
    const queue = new ConnectionQueuing(2)
    const task = async () => {
    }

    queue.start()
    assert(queue.push(task))
    assert(queue.push(task))
    assert(queue.push(task) === false)
  })

  it('should run task every interval', (done) => {
    const runningClock = []
    const queue = new ConnectionQueuing(2)
    const task = async () => {
      runningClock.push(clock.now)
    }
    queue.start()
    assert(queue.push(task))
    assert(queue.push(task))
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
    queue.stop()

    setTimeout(() => {
      assert(runningClock.length === 2)
      done()
    }, 10)
  })

  it('should not crash when repeat stop queue', () => {
    const queue = new ConnectionQueuing(2, 10)
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
    const queue = new ConnectionQueuing(2, 100)
    const processSpy = sinon.spy(queue, 'process')
    queue.start()
    clock.tick(100)
    setTimeout(() => {
      assert(processSpy.called)
      done()
    }, 10)
  })

  it('should run process although error occurred', (done) => {
    const queue = new ConnectionQueuing(2, 100)
    const failedTask = sinon.spy(async () => {
      throw new Error('error')
    })
    const normalTask = sinon.spy(async () => {
    })
    queue.start()
    assert(queue.push(failedTask))
    assert(queue.push(normalTask))
    clock.tick(100)
    setTimeout(() => {
      clock.tick(100)
    }, 1)
    setTimeout(() => {
      // assert(queue.queue.length === 0)
      assert(failedTask.called)
      assert(normalTask.called)
      done()
    }, 10)
  })

  it('should ignore trigger when event not complete', (done) => {
    const queue = new ConnectionQueuing(2, 10)
    const processSpy = sinon.spy(queue, 'process')
    const longTask = async () => {
      return new Promise((resolve) => {
        setInterval(() => {
          resolve()
        }, 50)
      })
    }
    queue.start()
    queue.push(longTask)
    clock.tick(10)
    setTimeout(() => {
      clock.tick(10)
    }, 0)
    setTimeout(() => {
      clock.tick(10)
    }, 1)
    setTimeout(() => {
      assert(processSpy.calledOnce)
      done()
    }, 10)
  })
})
