'use strict'
// folder
// external modules
var LZString = require('lz-string')
var moment = require('moment')

// core
var config = require('./config')
var logger = require('./logger')
var response = require('./response')
var models = require('./models')

// public
var Folder = {
  getNotes: getNotes,
  folderMoveNote: folderMoveNote
}

function getNotes (req, res) {
  if (req.isAuthenticated()) {
    var userId = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === false) return response.errorForbidden(res)
      if (folder === null) return response.errorNotFound(res)
      getFolderNotes(folder, function (err, notes) {
        if (err) return response.errorInternalError(res)
        res.send({
          notes: notes
        })
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function getFolderNotes (folder, callback) {
  var _note = []
  folder.getNotes().then(function (notes) {
    notes.forEach(function (note) {
      var noteInfo = models.Note.parseNoteInfo(note.content)
      _note.push({
        id: LZString.compressToBase64(note.id),
        text: note.title,
        time: moment(note.lastchangeAt || note.createdAt).valueOf(),
        tag: noteInfo.tags
      })
    })
    if (config.debug) logger.info('read notes success: ' + folder.id)
    return callback(null, _note)
  }).catch(function (err) {
    logger.error('read notes failed: ' + err)
    return callback(err, null)
  })
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
