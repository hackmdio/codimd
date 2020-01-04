'use strict'

const EventEmitter = require('events').EventEmitter

/**
 * Queuing Class for connection queuing
 */

const QueueEvent = {
  Tick: 'Tick',
  Push: 'Push',
  Finish: 'Finish'
}

class ProcessQueue extends EventEmitter {
  constructor ({
    maximumLength = 500,
    triggerTimeInterval = 5000,
    // execute on push
    proactiveMode = true,
    // execute next work on finish
    continuousMode = true
  }) {
    super()
    this.max = maximumLength
    this.triggerTime = triggerTimeInterval
    this.taskMap = new Map()
    this.queue = []
    this.lock = false

    this.on(QueueEvent.Tick, this.onEventProcessFunc.bind(this))
    if (proactiveMode) {
      this.on(QueueEvent.Push, this.onEventProcessFunc.bind(this))
    }
    if (continuousMode) {
      this.on(QueueEvent.Finish, this.onEventProcessFunc.bind(this))
    }
  }

  onEventProcessFunc () {
    if (this.lock) return
    this.lock = true
    setImmediate(() => {
      this.process()
    })
  }

  start () {
    if (this.eventTrigger) return
    this.eventTrigger = setInterval(() => {
      this.emit(QueueEvent.Tick)
    }, this.triggerTime)
  }

  stop () {
    if (this.eventTrigger) {
      clearInterval(this.eventTrigger)
      this.eventTrigger = null
    }
  }

  checkTaskIsInQueue (id) {
    return this.taskMap.has(id)
  }

  /**
   * pushWithKey a promisify-task to queue
   * @param id {string}
   * @param processingFunc {Function<Promise>}
   * @returns {boolean} if success return true, otherwise false
   */
  push (id, processingFunc) {
    if (this.queue.length >= this.max) return false
    if (this.checkTaskIsInQueue(id)) return false
    const task = {
      id: id,
      processingFunc: processingFunc
    }
    this.taskMap.set(id, true)
    this.queue.push(task)
    this.start()
    this.emit(QueueEvent.Push)
    return true
  }

  process () {
    if (this.queue.length <= 0) {
      this.stop()
      this.lock = false
      return
    }

    const task = this.queue.shift()
    this.taskMap.delete(task.id)

    const finishTask = () => {
      this.lock = false
      setImmediate(() => {
        this.emit(QueueEvent.Finish)
      })
    }
    task.processingFunc().then(finishTask).catch(finishTask)
  }
}

exports.ProcessQueue = ProcessQueue
