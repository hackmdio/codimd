'use strict'
// history
// external modules
var LZString = require('lz-string')

// core
var config = require('./config')
var logger = require('./logger')
var response = require('./response')
var models = require('./models')

// public
var History = {
  historyGet: historyGet,
  historyPost: historyPost,
  historyDelete: historyDelete,
  updateHistory: updateHistory
}

function getHistory (userid, callback) {
  models.User.findOne({
    where: {
      id: userid
    }
  }).then(function (user) {
    if (!user) {
      return callback(null, null)
    }
    var history = {}
    if (user.history) {
      history = JSON.parse(user.history)
      // migrate LZString encoded note id to base64url encoded note id
      for (let i = 0, l = history.length; i < l; i++) {
        let item = history[i]
        // try to parse in base64url
        let id = models.Note.decodeNoteId(item.id)
        if (!id || !models.Note.checkNoteIdValid(id)) {
          // try to parse in LZString if it can't be parsed in base64url
          try {
            id = LZString.decompressFromBase64(item.id)
          } catch (err) {
            id = null
          }
          if (id && models.Note.checkNoteIdValid(id)) {
            // replace the note id to base64url encoded note id
            history[i].id = models.Note.encodeNoteId(id)
          }
        }
      }
      history = parseHistoryToObject(history)
    }
    if (config.debug) {
      logger.info('read history success: ' + user.id)
    }
    return callback(null, history)
  }).catch(function (err) {
    logger.error('read history failed: ' + err)
    return callback(err, null)
  })
}

function setHistory (userid, history, callback) {
  models.User.update({
    history: JSON.stringify(parseHistoryToArray(history))
  }, {
    where: {
      id: userid
    }
  }).then(function (count) {
    return callback(null, count)
  }).catch(function (err) {
    logger.error('set history failed: ' + err)
    return callback(err, null)
  })
}

function updateHistory (userid, noteId, document, time) {
  if (userid && noteId && typeof document !== 'undefined') {
    getHistory(userid, function (err, history) {
      if (err || !history) return
      if (!history[noteId]) {
        history[noteId] = {}
      }
      var noteHistory = history[noteId]
      var noteInfo = models.Note.parseNoteInfo(document)
      noteHistory.id = noteId
      noteHistory.text = noteInfo.title
      noteHistory.time = time || Date.now()
      noteHistory.tags = noteInfo.tags
      setHistory(userid, history, function (err, count) {
        if (err) {
          logger.log(err)
        }
      })
    })
  }
}

function parseHistoryToArray (history) {
  var _history = []
  Object.keys(history).forEach(function (key) {
    var item = history[key]
    _history.push(item)
  })
  return _history
}

function parseHistoryToObject (history) {
  var _history = {}
  for (var i = 0, l = history.length; i < l; i++) {
    var item = history[i]
    _history[item.id] = item
  }
  return _history
}

function historyGet (req, res) {
  if (req.isAuthenticated()) {
    getHistory(req.user.id, function (err, history) {
      if (err) return response.errorInternalError(res)
      if (!history) return response.errorNotFound(res)
      res.send({
        history: parseHistoryToArray(history)
      })
    })
  } else {
    return response.errorForbidden(res)
  }
}

function historyPost (req, res) {
  if (req.isAuthenticated()) {
    var noteId = req.params.noteId
    if (!noteId) {
      if (typeof req.body['history'] === 'undefined') return response.errorBadRequest(res)
      if (config.debug) { logger.info('SERVER received history from [' + req.user.id + ']: ' + req.body.history) }
      try {
        var history = JSON.parse(req.body.history)
      } catch (err) {
        return response.errorBadRequest(res)
      }
      if (Array.isArray(history)) {
        setHistory(req.user.id, history, function (err, count) {
          if (err) return response.errorInternalError(res)
          res.end()
        })
      } else {
        return response.errorBadRequest(res)
      }
    } else {
      if (typeof req.body['pinned'] === 'undefined') return response.errorBadRequest(res)
      getHistory(req.user.id, function (err, history) {
        if (err) return response.errorInternalError(res)
        if (!history) return response.errorNotFound(res)
        if (!history[noteId]) return response.errorNotFound(res)
        if (req.body.pinned === 'true' || req.body.pinned === 'false') {
          history[noteId].pinned = (req.body.pinned === 'true')
          setHistory(req.user.id, history, function (err, count) {
            if (err) return response.errorInternalError(res)
            res.end()
          })
        } else {
          return response.errorBadRequest(res)
        }
      })
    }
  } else {
    return response.errorForbidden(res)
  }
}

function historyDelete (req, res) {
  if (req.isAuthenticated()) {
    var noteId = req.params.noteId
    if (!noteId) {
      setHistory(req.user.id, [], function (err, count) {
        if (err) return response.errorInternalError(res)
        res.end()
      })
    } else {
      getHistory(req.user.id, function (err, history) {
        if (err) return response.errorInternalError(res)
        if (!history) return response.errorNotFound(res)
        delete history[noteId]
        setHistory(req.user.id, history, function (err, count) {
          if (err) return response.errorInternalError(res)
          res.end()
        })
      })
    }
  } else {
    return response.errorForbidden(res)
  }
}

module.exports = History
