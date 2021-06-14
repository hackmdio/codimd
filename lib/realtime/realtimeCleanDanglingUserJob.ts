'use strict'

import async from "async";

import config from "../config";
import {logger} from "../logger";
import {JobWorker} from "./jobWorker";
import {RealtimeModule} from "./realtime-types";

/**
 * clean when user not in any rooms or user not in connected list
 */
export class CleanDanglingUserJob implements JobWorker {
  private realtime: RealtimeModule;
  private timer: NodeJS.Timeout;

  constructor(realtime: RealtimeModule) {
    this.realtime = realtime
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(this.cleanDanglingUser.bind(this), 60000)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  cleanDanglingUser(): void {
    const users = this.realtime.getUserPool()
    async.each(Object.keys(users), (key, callback) => {
      const socket = this.realtime.io.sockets.connected[key]
      if ((!socket && users[key]) ||
        (socket && (!socket.rooms || Object.keys(socket.rooms).length <= 0))) {
        if (config.debug) {
          logger.info('cleaner found redundant user: ' + key)
        }
        if (!socket) {
          return callback(null, null)
        }
        if (!this.realtime.disconnectProcessQueue.checkTaskIsInQueue(socket.id)) {
          this.realtime.queueForDisconnect(socket)
        }
      }
      return callback(null, null)
    }, function (err) {
      if (err) {
        logger.error('cleaner error', err)
      }
    })
  }
}

