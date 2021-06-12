'use strict'

import async from "async";

import * as config from "../config";
import {logger} from "../logger";

/**
 * clean when user not in any rooms or user not in connected list
 */
export class CleanDanglingUserJob {
  private realtime: any;
  private timer: NodeJS.Timeout;

  constructor(realtime) {
    this.realtime = realtime
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(this.cleanDanglingUser.bind(this), 60000)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  cleanDanglingUser() {
    const users = this.realtime.getUserPool()
    async.each(Object.keys(users), (key, callback) => {
      const socket = this.realtime.io.sockets.connected[key]
      if ((!socket && users[key]) ||
        (socket && (!socket.rooms || socket.rooms.length <= 0))) {
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

