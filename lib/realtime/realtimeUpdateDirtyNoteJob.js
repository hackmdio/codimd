'use strict'

const config = require('../config')
const logger = require('../logger')
const moment = require('moment')

class UpdateDirtyNoteJob {
  constructor (realtime) {
    this.realtime = realtime
  }

  start () {
    if (this.timer) return
    this.timer = setInterval(this.updateDirtyNotes.bind(this), 1000)
  }

  stop () {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDirtyNotes () {
    const notes = this.realtime.getNotePool()
    Object.keys(notes).forEach((key) => {
      const note = notes[key]
      this.updateDirtyNote(note)
        .catch((err) => {
          logger.error('updateDirtyNote: updater error', err)
        })
    })
  }

  async updateDirtyNote (note) {
    const notes = this.realtime.getNotePool()
    if (!note.server.isDirty) return

    if (config.debug) logger.info('updateDirtyNote: updater found dirty note: ' + note.id)
    note.server.isDirty = false

    try {
      const _note = await this.updateNoteAsync(note)
      // handle when note already been clean up
      if (!notes[note.id] || !notes[note.id].server) return

      if (!_note) {
        this.realtime.io.to(note.id).emit('info', {
          code: 404
        })
        logger.error('updateDirtyNote: note not found: ', note.id)
        this.realtime.disconnectSocketOnNote(note)
      }

      note.updatetime = moment(_note.lastchangeAt).valueOf()
      this.realtime.emitCheck(note)
    } catch (err) {
      logger.error('updateDirtyNote: note not found: ', note.id)
      this.realtime.io.to(note.id).emit('info', {
        code: 404
      })
      this.realtime.disconnectSocketOnNote(note)
      throw err
    }
  }

  updateNoteAsync (note) {
    return new Promise((resolve, reject) => {
      this.realtime.updateNote(note, (err, _note) => {
        if (err) {
          return reject(err)
        }
        return resolve(_note)
      })
    })
  }
}

exports.UpdateDirtyNoteJob = UpdateDirtyNoteJob
