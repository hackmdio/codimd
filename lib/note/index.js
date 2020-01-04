'use strict'

const config = require('../config')
const { Note } = require('../models')

const { newCheckViewPermission, errorForbidden, responseCodiMD, errorNotFound } = require('../response')
const { updateHistory } = require('../history')

async function getNoteById (noteId) {
  const id = await Note.parseNoteIdAsync(noteId)
  const note = await Note.findOne({
    where: {
      id: id
    }
  })
  return note
}

async function createNote (userId, noteAlias) {
  if (!config.allowAnonymous && !!userId) {
    throw new Error('can not create note')
  }

  const note = await Note.create({
    ownerId: userId,
    alias: noteAlias,
  })

  if (userId) {
    updateHistory(userId, note)
  }

  return note
}

// controller
async function showNote (req, res) {
  const noteId = req.params.noteId
  const userId = req.user ? req.user.id : null

  let note = await getNoteById(noteId)

  if (!note) {
    // if allow free url enable, auto create note
    if (!config.allowFreeURL || config.forbiddenNoteIDs.includes(noteId)) {
      return errorNotFound(res)
    }
    note = await createNote(userId, noteId)
  }

  if (!newCheckViewPermission(note, req.isAuthenticated(), userId)) {
    return errorForbidden(res)
  }

  // force to use note id
  const id = Note.encodeNoteId(note.id)
  if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) {
    return res.redirect(config.serverURL + '/' + (note.alias || id))
  }
  return responseCodiMD(res, note)
}

exports.showNote = showNote
