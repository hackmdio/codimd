'use strict'

import {logger} from "../logger";
import {saveAllNotesRevision} from "../services/note";
import {JobWorker} from "./jobWorker";
import {RealtimeModule} from "./realtime-types";

/**
 * clean when user not in any rooms or user not in connected list
 */
export class SaveRevisionJob implements JobWorker {
  private realtime: RealtimeModule;
  private saverSleep: boolean;
  private timer: NodeJS.Timeout;

  constructor(realtime: RealtimeModule) {
    this.realtime = realtime
    this.saverSleep = false
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(this.saveRevision.bind(this), 5 * 60 * 1000)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  saveRevision(): void {
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

  getSaverSleep(): boolean {
    return this.saverSleep
  }

  setSaverSleep(val: boolean): void {
    this.saverSleep = val
  }
}
