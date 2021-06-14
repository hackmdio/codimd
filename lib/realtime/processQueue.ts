import {EventEmitter} from "events";
import {JobWorker} from "./jobWorker";

/**
 * Queuing Class for connection queuing
 */

const QueueEvent = {
  Tick: 'Tick',
  Push: 'Push',
  Finish: 'Finish'
}

type AsyncFunc = () => Promise<void>
type SyncFun = () => void
type TaskFunc = AsyncFunc | SyncFun

interface Task {
  id: string
  processingFunc: TaskFunc
}


export interface ProcessQueueOptions {
  maximumLength?: number
  triggerTimeInterval?: number
  proactiveMode?: boolean
  continuousMode?: boolean
}

const defaultOptions: ProcessQueueOptions = {
  maximumLength: 500,
  triggerTimeInterval: 5000,
  // execute on push
  proactiveMode: true,
  // execute next work on finish
  continuousMode: true
}

export class ProcessQueue extends EventEmitter implements JobWorker {
  private readonly max: number;
  private readonly triggerTime: number;
  private taskMap: Map<string, boolean>;
  public queue: Task[];
  public lock: boolean;
  private eventTrigger: NodeJS.Timeout;

  constructor({
                maximumLength = 500,
                triggerTimeInterval = 5000,
                // execute on push
                proactiveMode = true,
                // execute next work on finish
                continuousMode = true
              }: ProcessQueueOptions = {}) {
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

  onEventProcessFunc(): void {
    if (this.lock) return
    this.lock = true
    setImmediate(() => {
      this.process()
    })
  }

  start(): void {
    if (this.eventTrigger) return
    this.eventTrigger = setInterval(() => {
      this.emit(QueueEvent.Tick)
    }, this.triggerTime)
  }

  stop(): void {
    if (this.eventTrigger) {
      clearInterval(this.eventTrigger)
      this.eventTrigger = null
    }
  }

  checkTaskIsInQueue(id: string): boolean {
    return this.taskMap.has(id)
  }

  /**
   * pushWithKey a promisify-task to queue
   * @param id {string}
   * @param processingFunc {Function<Promise>}
   * @returns {boolean} if success return true, otherwise false
   */
  push(id: string, processingFunc: TaskFunc): boolean {
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

  process(): void {
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
    const runFunc = task.processingFunc() as Promise<void>;
    // Wait until the promise fulfilled if processing function is a promise
    if (typeof runFunc.then === 'function') {
      runFunc.then(finishTask).catch(finishTask)
    } else {
      finishTask()
    }
  }
}

