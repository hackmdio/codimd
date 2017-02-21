'use strict'
// folder
// external modules
var LZString = require('lz-string')

// core
var logger = require('./logger')
var response = require('./response')
var models = require('./models')

// public
var Folder = {
  folderMoveNote: folderMoveNote
}

function folderMoveNote (req, res) {
  if (req.isAuthenticated()) {
    var noteId = LZString.decompressFromBase64(req.params.noteId)
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    var userId = req.user.id
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === null) return response.errorNotFound(res)
      if (folder === false) return response.errorForbidden(res)
      moveNoteTo(userId, noteId, folderId, function (err, note) {
        if (err) return response.errorInternalError(res)
        if (note === null) return response.errorNotFound(res)
        if (note === false) return response.errorForbidden(res)
        res.end()
      })
    })
  } else {
    return response.errorForbindden(res)
  }
}

function moveNoteTo (ownerId, noteId, folderId, callback) {
  models.Note.findOne({
    where: {
      id: noteId
    }
  }).then(function (note) {
    if (!note) return callback(null, null)
    if (ownerId !== note.ownerId) return callback(null, false)
    note.update({
      folderId: folderId
    })
    return callback(null, true)
  }).catch(function (err) {
    logger.error('move note to folder failed: ' + err)
    return callback(err, null)
  })
}

function checkFolderPermission (ownerId, folderId, callback) {
  models.Folder.findOne({
    where: {
      id: folderId
    }
  }).then(function (folder) {
    if (!folder) return callback(null, null)
    if (ownerId !== folder.ownerId) return callback(null, false)
    return callback(null, folder)
  }).catch(function (err) {
    logger.error('check folder failed: ' + err)
    return callback(err, null)
  })
}

module.exports = Folder
