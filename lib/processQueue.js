'use strict'

const EventEmitter = require('events').EventEmitter

/**
 * Queuing Class for connection queuing
 */

const QueueEvent = {
  Tick: 'Tick'
}

class ProcessQueue extends EventEmitter {
  constructor (maximumLength, triggerTimeInterval = 10) {
    super()
    this.max = maximumLength
    this.triggerTime = triggerTimeInterval
    this.taskMap = new Map()
    this.queue = []
    this.lock = false

    this.on(QueueEvent.Tick, () => {
      if (this.lock) return
      this.lock = true
      setImmediate(() => {
        this.process()
      })
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
    this.emit(QueueEvent.Tick)
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
        this.emit(QueueEvent.Tick)
      })
    }
    task.processingFunc().then(finishTask).catch(finishTask)
  }
}

exports.ProcessQueue = ProcessQueue
