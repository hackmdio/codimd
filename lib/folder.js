'use strict'
// folder
// external modules
var LZString = require('lz-string')
var moment = require('moment')
var S = require('string')

// core
var config = require('./config')
var logger = require('./logger')
var response = require('./response')
var models = require('./models')
var history = require('./history')

// public
var Folder = {
  getAllFolders: getAllFolders,
  getNotes: getNotes,
  folderNew: folderNew,
  folderMove: folderMove,
  folderDelete: folderDelete,
  folderRename: folderRename,
  folderNewNote: folderNewNote,
  folderMoveNote: folderMoveNote,
  folderSearch: folderSearch
}

function getAllFolders (req, res) {
  if (req.isAuthenticated()) {
    models.Folder.findAll({
      where: {
        ownerId: req.user.id
      },
      attributes: ['id', 'name', 'createdAt', 'parentId'],
      hierarchy: true
    }).then(function (folders) {
      var _folders = JSON.parse(JSON.stringify(folders), function (k, v) {
        if (k === 'id') return LZString.compressToBase64(v)
        else if (k === 'name') this.text = S(v).stripTags().s
        else if (k === 'createdAt') this.time = moment(v).valueOf()
        else if (k === 'children') this.nodes = v
        else if (k !== 'parentId') return v
      })
      res.send({
        folders: _folders[0].nodes ? _folders[0].nodes : []
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function getNotes (req, res) {
  if (req.isAuthenticated()) {
    var userId = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === false) return response.errorForbidden(res)
      if (folder === null) return response.errorNotFound(res)
      getFolderNotes(req.user, folder, function (err, notes) {
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

function getFolderNotes (user, folder, callback) {
  var _note = []
  var promise = null

  if (folder.id === user.folderId) {
    promise = models.Note.findAll({
      where: {
        $and: [
          {
            ownerId: user.id
          },
          {
            $or: [
              { folderId: null },
              { folderId: folder.id }
            ]
          }
        ]
      }
    })
  } else {
    promise = folder.getNotes()
  }

  promise.then(function (notes) {
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

function folderNew (req, res) {
  var owner = null
  if (req.isAuthenticated()) {
    owner = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    var folderName = req.params.newName
    checkFolderPermission(owner, folderId, function (err, parentFolder) {
      if (err) return response.errorInternalError(res)
      if (parentFolder === false) return response.errorForbidden(res)
      if (parentFolder === null) return response.errorNotFound(res)
      if (folderName === null) return response.errorBadRequest(res)

      models.Folder.create({
        ownerId: owner,
        name: folderName,
        parentId: folderId
      }).then(function (folder) {
        res.send({
          id: LZString.compressToBase64(folder.id),
          text: folder.name,
          time: moment(folder.createAt).valueOf()
        })
        if (config.debug) logger.info('create folder success')
      }).catch(function (err) {
        logger.error('create folder failed' + err)
        return response.errorInternalError(res)
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function folderMove (req, res) {
  var owner = null
  if (req.isAuthenticated()) {
    owner = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    var destinationId = LZString.decompressFromBase64(req.params.destinationId)

    checkFolderPermission(owner, destinationId, function (err, newParent) {
      if (err) return response.errorInternalError(res)
      if (newParent === false) return response.errorForbidden(res)
      if (newParent === null) return response.errorNotFound(res)

      checkFolderPermission(owner, folderId, function (err, folder) {
        if (err) return response.errorInternalError(res)
        if (folder === false) return response.errorForbidden(res)
        if (folder === null) return response.errorNotFound(res)

        folder.update({
          parentId: destinationId
        }).then(function (folder) {
          res.send({
            id: LZString.compressToBase64(folder.id),
            text: folder.name,
            time: moment(folder.createAt).valueOf()
          })
          if (config.debug) logger.info('move folder success ' + owner + ' ' + folder.name)
        }).catch(function (err) {
          logger.error('move folder failed ' + err)
          return response.errorInternalError(res)
        })
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function folderDelete (req, res) {
  if (req.isAuthenticated()) {
    var userId = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === false) return response.errorForbidden(res)
      if (folder === null) return response.errorNotFound(res)

      var notesDeleted = []
      folder.getDescendents({ order: [ [ 'hierarchyLevel', 'DESC' ] ] })
        .each(function (_folder) {
          return models.Note.findAll({
            where: {
              folderId: _folder.folderId,
              ownerId: userId
            }
          }).then(function (notes) {
            for (var i = 0; i < notes.length; i++) {
              notesDeleted.push(LZString.compressToBase64(notes[i].id))
            }
            return models.Note.destroy({
              where: {
                folderId: _folder.folderId,
                ownerId: userId
              }
            })
          }).then(function (destroyedNotes) {
            if (config.debug) logger.info('delete note in folder success: ' + _folder.folderId)
            _folder.destroy()
          })
        }).then(function () {
          return models.Note.findAll({
            where: {
              folderId: folderId,
              ownerId: userId
            }
          })
        }).then(function (notes) {
          for (var i = 0; i < notes.length; i++) {
            notesDeleted.push(LZString.compressToBase64(notes[i].id))
          }
          return models.Note.destroy({
            where: {
              folderId: folderId,
              ownerId: userId
            }
          })
        }).then(function (destroyedNotes) {
          folder.destroy()
          res.end()
        }).catch(function (err) {
          logger.error('delete folder fail: ' + err)
          return response.errorInternalError(res)
        }).finally(function () {
          history.getHistory(userId, function (_, userHistory) {
            for (var i = 0; i < notesDeleted.length; i++) {
              delete userHistory[notesDeleted[i]]
            }
            history.setHistory(userId, userHistory, function () {})
          })
        })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function folderRename (req, res) {
  if (req.isAuthenticated()) {
    var userId = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    var newName = req.params.newName
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === false) return response.errorForbidden(res)
      if (folder === null) return response.errorNotFound(res)
      setName(folder, newName, function (err, folder) {
        if (err) return response.errorInternalError(res)
        res.end()
      })
    })
  } else {
    return response.errorForbindden(res)
  }
}

function setName (folder, folderName, callback) {
  folder.update({
    name: folderName
  }).then(function (affectedFolders) {
    return callback(null, true)
  }).catch(function (err) {
    logger.error('set folder name failed: ' + err)
    return callback(err, null)
  })
}

function folderNewNote (req, res) {
  if (req.isAuthenticated()) {
    var userId = req.user.id
    var folderId = LZString.decompressFromBase64(req.params.folderId)
    checkFolderPermission(userId, folderId, function (err, folder) {
      if (err) return response.errorInternalError(res)
      if (folder === false) return response.errorForbidden(res)
      if (folder === null) return response.errorNotFound(res)
      newNote(userId, folder, function (err, note) {
        if (err) return response.errorInternalError(res)
        res.send({
          note: {
            id: LZString.compressToBase64(note.id)
          }
        })
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function newNote (ownerId, folder, callback) {
  models.Note.create({
    ownerId: ownerId,
    folderId: folder.id
  }).then(function (note) {
    return callback(null, note)
  }).catch(function (err) {
    logger.error('create note in folder failed: ' + err)
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

function folderSearch (req, res) {
  if (req.isAuthenticated()) {
    var keyword = req.params.keyword
    var userId = req.user.id
    searchNote(keyword, userId, function (err, notes) {
      if (err) return response.errorInternalError(res)
      searchFolder(keyword, userId, function (err, folders) {
        if (err) return response.errorInternalError(res)
        res.send({
          notes: notes,
          folders: folders
        })
      })
    })
  } else {
    return response.errorForbindden(res)
  }
}

function searchNote (keyword, userId, callback) {
  models.Note.findAll({
    where: {
      ownerId: userId,
      content: {
        $like: '%' + keyword + '%'
      }
    }
  }).then(function (notes) {
    var _notes = []
    notes.forEach(function (note) {
      var noteInfo = models.Note.parseNoteInfo(note.content)
      _notes.push({
        id: LZString.compressToBase64(note.id),
        folderId: LZString.compressToBase64(note.folderId),
        text: note.title,
        time: moment(note.lastchangeAt || note.createdAt).valueOf(),
        tag: noteInfo.tags
      })
    })
    if (config.debug) logger.info('keyword for notes searching success: ' + keyword)
    return callback(null, _notes)
  }).catch(function (err) {
    logger.error('keyword for notes searching failed: ' + err)
    return callback(err, null)
  })
}

function searchFolder (keyword, userId, callback) {
  models.Folder.findAll({
    where: {
      ownerId: userId,
      name: {
        $like: '%' + keyword + '%'
      }
    }
  }).then(function (folders) {
    var _folders = []
    folders.forEach(function (folder) {
      _folders.push({
        id: LZString.compressToBase64(folder.id),
        text: folder.name,
        time: moment(folder.createdAt).valueOf()
      })
    })
    if (config.debug) logger.info('keyword for folders searching success: ' + keyword)
    return callback(null, _folders)
  }).catch(function (err) {
    logger.error('keyword for folders searching failed: ' + err)
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
