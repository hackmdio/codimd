'use strict'

class ProcessQueueFake {
  constructor () {
    this.taskMap = new Map()
    this.queue = []
  }

  start () {

  }

  stop () {

  }

  checkTaskIsInQueue (id) {
    return this.taskMap.has(id)
  }

  push (id, processFunc) {
    this.queue.push({
      id: id,
      processFunc: processFunc
    })
    this.taskMap.set(id, true)
  }

  process () {

  }
}

exports.ProcessQueueFake = ProcessQueueFake
exports.ProcessQueue = ProcessQueueFake
