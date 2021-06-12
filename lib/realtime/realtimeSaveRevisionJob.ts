'use strict'

import {logger} from "../logger";
import {saveAllNotesRevision} from "../services/note";

/**
 * clean when user not in any rooms or user not in connected list
 */
export class SaveRevisionJob {
  private realtime: any;
  private saverSleep: boolean;
  private timer: NodeJS.Timeout;

  constructor(realtime) {
    this.realtime = realtime
    this.saverSleep = false
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(this.saveRevision.bind(this), 5 * 60 * 1000)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  saveRevision() {
    if (this.getSaverSleep()) return
    saveAllNotesRevision((err, notes) => {
      if (err) {
        logger.error('revision saver failed: ' + err)
      }
      if (notes && notes.length <= 0) {
        this.setSaverSleep(true)
      }
    })
  }

  getSaverSleep() {
    return this.saverSleep
  }

  setSaverSleep(val) {
    this.saverSleep = val
  }
}
