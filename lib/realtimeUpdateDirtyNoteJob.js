'use strict'

const async = require('async')
const config = require('./config')
const logger = require('./logger')
const moment = require('moment')

class UpdateDirtyNoteJob {
  constructor (realtime) {
    this.realtime = realtime
  }

  start () {
    setInterval(this.updateDirtyNote.bind(this), 1000)
  }

  updateDirtyNote () {
    const notes = this.realtime.getNotePool()
    async.each(Object.keys(notes), (key, callback) => {
      const note = notes[key]
      if (!note.server.isDirty) return callback(null, null)

      if (config.debug) logger.info('updater found dirty note: ' + key)
      note.server.isDirty = false
      this.realtime.updateNote(note, (err, _note) => {
        // handle when note already been clean up
        if (!notes[key] || !notes[key].server) return callback(null, null)
        if (!_note) {
          this.realtime.io.to(note.id).emit('info', {
            code: 404
          })
          logger.error('note not found: ', note.id)
        }

        if (err || !_note) {
          this.realtime.disconnectSocketOnNote(note)
          return callback(err, null)
        }

        note.updatetime = moment(_note.lastchangeAt).valueOf()
        this.realtime.emitCheck(note)
        return callback(null, null)
      })
    }, (err) => {
      if (err) return logger.error('updater error', err)
    })
  }
}

exports.UpdateDirtyNoteJob = UpdateDirtyNoteJob
