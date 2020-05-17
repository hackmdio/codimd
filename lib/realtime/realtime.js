'use strict'
// realtime
// external modules
const cookie = require('cookie')
const cookieParser = require('cookie-parser')
const url = require('url')
const randomcolor = require('randomcolor')
const Chance = require('chance')
const chance = new Chance()
const moment = require('moment')

const get = require('lodash/get')

// core
const config = require('../config')
const logger = require('../logger')
const history = require('../history')
const models = require('../models')

// ot
const ot = require('../ot')

const { ProcessQueue } = require('./processQueue')
const { RealtimeClientConnection } = require('./realtimeClientConnection')
const { UpdateDirtyNoteJob } = require('./realtimeUpdateDirtyNoteJob')
const { CleanDanglingUserJob } = require('./realtimeCleanDanglingUserJob')
const { SaveRevisionJob } = require('./realtimeSaveRevisionJob')

// public
const realtime = {
  io: null,
  onAuthorizeSuccess: onAuthorizeSuccess,
  onAuthorizeFail: onAuthorizeFail,
  secure: secure,
  connection: connection,
  getStatus: getStatus,
  isReady: isReady,
  maintenance: true
}

const connectProcessQueue = new ProcessQueue({})
const disconnectProcessQueue = new ProcessQueue({})
const updateDirtyNoteJob = new UpdateDirtyNoteJob(realtime)
const cleanDanglingUserJob = new CleanDanglingUserJob(realtime)
const saveRevisionJob = new SaveRevisionJob(realtime)

// TODO: test it
function onAuthorizeSuccess (data, accept) {
  accept()
}

// TODO: test it
function onAuthorizeFail (data, message, error, accept) {
  accept() // accept whether authorize or not to allow anonymous usage
}

// TODO: test it
// secure the origin by the cookie
function secure (socket, next) {
  try {
    var handshakeData = socket.request
    if (handshakeData.headers.cookie) {
      handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)
      handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie[config.sessionName], config.sessionSecret)
      if (handshakeData.sessionID &&
        handshakeData.cookie[config.sessionName] &&
        handshakeData.cookie[config.sessionName] !== handshakeData.sessionID) {
        if (config.debug) {
          logger.info('AUTH success cookie: ' + handshakeData.sessionID)
        }
        return next()
      } else {
        next(new Error('AUTH failed: Cookie is invalid.'))
      }
    } else {
      next(new Error('AUTH failed: No cookie transmitted.'))
    }
  } catch (ex) {
    next(new Error('AUTH failed:' + JSON.stringify(ex)))
  }
}

// TODO: only use in `updateDirtyNote`
// TODO: test it
function emitCheck (note) {
  var out = {
    title: note.title,
    updatetime: note.updatetime,
    lastchangeuser: note.lastchangeuser,
    lastchangeuserprofile: note.lastchangeuserprofile,
    authors: note.authors,
    authorship: note.authorship
  }
  realtime.io.to(note.id).emit('check', out)
}

// actions
var users = {}
var notes = {}

function getNotePool () {
  return notes
}

function isNoteExistsInPool (noteId) {
  return !!notes[noteId]
}

function addNote (note) {
  if (exports.isNoteExistsInPool(note.id)) return false
  notes[note.id] = note
  return true
}

function getNotePoolSize () {
  return Object.keys(notes).length
}

function deleteNoteFromPool (noteId) {
  delete notes[noteId]
}

function deleteAllNoteFromPool () {
  Object.keys(notes).forEach(noteId => {
    delete notes[noteId]
  })
}

function getNoteFromNotePool (noteId) {
  return notes[noteId]
}

function getUserPool () {
  return users
}

function getUserFromUserPool (userId) {
  return users[userId]
}

disconnectProcessQueue.start()
updateDirtyNoteJob.start()
cleanDanglingUserJob.start()
saveRevisionJob.start()

function disconnectSocketOnNote (note) {
  note.socks.forEach((sock) => {
    if (sock) {
      sock.emit('delete')
      setImmediate(() => {
        sock.disconnect(true)
      })
    }
  })
}

function updateNote (note, callback) {
  _updateNoteAsync(note).then(_note => {
    callback(null, _note)
  }).catch((err) => {
    logger.error(err)
    return callback(err, null)
  })
}

function findNoteByIdAsync (id) {
  return models.Note.findOne({
    where: {
      id: id
    }
  })
}

function updateHistoryForEveryUserCollaborateNote (note) {
  // update history to every user in this note
  const tempUsers = Object.assign({}, note.tempUsers)
  note.tempUsers = {}
  // update history should async function, but in there return values is not matter
  Object.keys(tempUsers).forEach(function (key) {
    exports.updateHistory(key, note, tempUsers[key])
  })
}

async function getUserProfileByIdAsync (id) {
  const user = await models.User.findOne({
    where: {
      id: id
    }
  })
  if (!user) return null
  return models.User.getProfile(user)
}

class UserNotFoundException extends Error {
  constructor () {
    super('user not found')
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

async function getLastChangeUserProfileAsync (currentLastChangeUserId, lastChangeUserIdInDatabase, lastChangeUserProfileInDatabase) {
  if (!currentLastChangeUserId) return null
  if (currentLastChangeUserId === lastChangeUserIdInDatabase) return lastChangeUserProfileInDatabase
  const profile = await getUserProfileByIdAsync(currentLastChangeUserId)
  if (!profile) {
    throw new UserNotFoundException()
  }
  return profile
}

function buildNoteUpdateData (note) {
  const body = note.server.document
  const title = note.title = models.Note.parseNoteTitle(body)
  return {
    title: title,
    content: body,
    authorship: note.authorship,
    lastchangeuserId: note.lastchangeuser,
    lastchangeAt: Date.now()
  }
}

async function _updateNoteAsync (note) {
  let noteModel = await findNoteByIdAsync(note.id)
  if (!noteModel) return null

  updateHistoryForEveryUserCollaborateNote(note)

  try {
    note.lastchangeuserprofile = await getLastChangeUserProfileAsync(
      note.lastchangeuser,
      noteModel.lastchangeuserId,
      noteModel.lastchangeuserprofile
    )
  } catch (err) {
    if (err instanceof UserNotFoundException) {
      return null
    }
    throw err
  }

  if (!note || !note.server) return null
  noteModel = await noteModel.update(buildNoteUpdateData(note))
  saveRevisionJob.setSaverSleep(false)
  return noteModel
}

// TODO: test it
function getStatus () {
  return models.Note.count()
    .then(function (notecount) {
      var distinctaddresses = []
      var regaddresses = []
      var distinctregaddresses = []
      Object.keys(users).forEach(function (key) {
        var user = users[key]
        if (!user) return
        let found = false
        for (let i = 0; i < distinctaddresses.length; i++) {
          if (user.address === distinctaddresses[i]) {
            found = true
            break
          }
        }
        if (!found) {
          distinctaddresses.push(user.address)
        }
        if (user.login) {
          regaddresses.push(user.address)
          let found = false
          for (let i = 0; i < distinctregaddresses.length; i++) {
            if (user.address === distinctregaddresses[i]) {
              found = true
              break
            }
          }
          if (!found) {
            distinctregaddresses.push(user.address)
          }
        }
      })

      return models.User.count()
        .then(function (regcount) {
          return {
            onlineNotes: Object.keys(notes).length,
            onlineUsers: Object.keys(users).length,
            distinctOnlineUsers: distinctaddresses.length,
            notesCount: notecount,
            registeredUsers: regcount,
            onlineRegisteredUsers: regaddresses.length,
            distinctOnlineRegisteredUsers: distinctregaddresses.length,
            isConnectionBusy: connectProcessQueue.lock,
            connectionSocketQueueLength: connectProcessQueue.queue.length,
            isDisconnectBusy: disconnectProcessQueue.lock,
            disconnectSocketQueueLength: disconnectProcessQueue.queue.length
          }
        })
        .catch(function (err) {
          logger.error('count user failed: ' + err)
          return Promise.reject(new Error('count user failed: ' + err))
        })
    }).catch(function (err) {
      logger.error('count note failed: ' + err)
      return Promise.reject(new Error('count note failed: ' + err))
    })
}

// TODO: test it
function isReady () {
  return realtime.io &&
    Object.keys(notes).length === 0 && Object.keys(users).length === 0 &&
    connectProcessQueue.queue.length === 0 && !connectProcessQueue.lock &&
    disconnectProcessQueue.queue.length === 0 && !disconnectProcessQueue.lock
}

function parseUrl (data) {
  try {
    if (url.URL) {
      return new url.URL(data)
    } else {
      // fallback legacy api
      // eslint-disable-next-line
      return url.parse(data)
    }
  } catch (e) {
  }
  return null
}

function extractNoteIdFromSocket (socket) {
  function extractNoteIdFromReferer (referer) {
    if (referer) {
      const hostUrl = parseUrl(referer)
      if (!hostUrl) {
        return false
      }
      if (config.urlPath) {
        return hostUrl.pathname.slice(config.urlPath.length + 1, hostUrl.pathname.length).split('/')[1]
      }
      return hostUrl.pathname.split('/')[1]
    }
    return false
  }

  if (!socket || !socket.handshake) {
    return false
  }

  if (get(socket, 'handshake.query.noteId')) {
    return decodeURIComponent(socket.handshake.query.noteId)
  }

  const referer = get(socket, 'handshake.headers.referer')
  if (referer) {
    // this part is only for backward compatibility only; current code
    // should be using noteId query parameter instead.
    return extractNoteIdFromReferer(referer)
  }

  return false
}

async function parseNoteIdFromSocketAsync (socket) {
  const noteId = extractNoteIdFromSocket(socket)
  if (!noteId) {
    return null
  }

  return new Promise((resolve, reject) => {
    models.Note.parseNoteId(noteId, function (err, id) {
      if (err) {
        reject(err)
      }
      if (!id) {
        resolve(null)
      }
      resolve(id)
    })
  })
}

// TODO: test it
function emitOnlineUsers (socket) {
  var noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  var users = []
  Object.keys(notes[noteId].users).forEach(function (key) {
    var user = notes[noteId].users[key]
    if (user) {
      users.push(buildUserOutData(user))
    }
  })
  var out = {
    users: users
  }
  realtime.io.to(noteId).emit('online users', out)
}

// TODO: test it
function emitUserStatus (socket) {
  var noteId = socket.noteId
  var user = users[socket.id]
  if (!noteId || !notes[noteId] || !user) return
  var out = buildUserOutData(user)
  socket.broadcast.to(noteId).emit('user status', out)
}

// TODO: test it
function emitRefresh (socket) {
  var noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  var note = notes[noteId]
  var out = {
    title: note.title,
    docmaxlength: config.documentMaxLength,
    owner: note.owner,
    ownerprofile: note.ownerprofile,
    lastchangeuser: note.lastchangeuser,
    lastchangeuserprofile: note.lastchangeuserprofile,
    authors: note.authors,
    authorship: note.authorship,
    permission: note.permission,
    createtime: note.createtime,
    updatetime: note.updatetime
  }
  socket.emit('refresh', out)
}

function checkViewPermission (req, note) {
  if (note.permission === 'private') {
    if (req.user && req.user.logged_in && req.user.id === note.owner) {
      return true
    } else {
      return false
    }
  } else if (note.permission === 'limited' || note.permission === 'protected') {
    if (req.user && req.user.logged_in) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}

// TODO: test it
async function fetchFullNoteAsync (noteId) {
  return models.Note.findOne({
    where: {
      id: noteId
    },
    include: [{
      model: models.User,
      as: 'owner'
    }, {
      model: models.User,
      as: 'lastchangeuser'
    }, {
      model: models.Author,
      as: 'authors',
      include: [{
        model: models.User,
        as: 'user'
      }]
    }]
  })
}

function buildAuthorProfilesFromNote (noteAuthors) {
  const authors = {}
  noteAuthors.forEach((author) => {
    const profile = models.User.getProfile(author.user)
    if (profile) {
      authors[author.userId] = {
        userid: author.userId,
        color: author.color,
        photo: profile.photo,
        name: profile.name
      }
    }
  })
  return authors
}

function makeNewServerNote (note) {
  const authors = buildAuthorProfilesFromNote(note.authors)

  return {
    id: note.id,
    alias: note.alias,
    title: note.title,
    owner: note.ownerId,
    ownerprofile: note.owner ? models.User.getProfile(note.owner) : null,
    permission: note.permission,
    lastchangeuser: note.lastchangeuserId,
    lastchangeuserprofile: note.lastchangeuser ? models.User.getProfile(note.lastchangeuser) : null,
    socks: [],
    users: {},
    tempUsers: {},
    createtime: moment(note.createdAt).valueOf(),
    updatetime: moment(note.lastchangeAt).valueOf(),
    server: new ot.EditorSocketIOServer(note.content, [], note.id, ifMayEdit, operationCallback),
    authors: authors,
    authorship: note.authorship
  }
}

// TODO: test it
function failConnection (code, err, socket) {
  logger.error(err)
  // emit error info
  socket.emit('info', {
    code: code
  })
  return socket.disconnect(true)
}

function queueForDisconnect (socket) {
  disconnectProcessQueue.push(socket.id, async function () {
    if (users[socket.id]) {
      delete users[socket.id]
    }
    const noteId = socket.noteId
    const note = notes[noteId]
    if (note) {
      // delete user in users
      if (note.users[socket.id]) {
        delete note.users[socket.id]
      }
      // remove sockets in the note socks
      let index
      do {
        index = note.socks.indexOf(socket)
        if (index !== -1) {
          note.socks.splice(index, 1)
        }
      } while (index !== -1)
      // remove note in notes if no user inside
      if (Object.keys(note.users).length === 0) {
        if (note.server.isDirty) {
          exports.updateNote(note, function (err, _note) {
            if (err) return logger.error('disconnect note failed: ' + err)
            // clear server before delete to avoid memory leaks
            note.server.document = ''
            note.server.operations = []
            delete note.server
            delete notes[noteId]
          })
        } else {
          delete note.server
          delete notes[noteId]
        }
      }
    }
    exports.emitOnlineUsers(socket)
  })
}

function buildUserOutData (user) {
  var out = {
    id: user.id,
    login: user.login,
    userid: user.userid,
    photo: user.photo,
    color: user.color,
    cursor: user.cursor,
    name: user.name,
    idle: user.idle,
    type: user.type
  }
  return out
}

// TODO: test it
function updateUserData (socket, user) {
  // retrieve user data from passport
  if (socket.request.user && socket.request.user.logged_in) {
    var profile = models.User.getProfile(socket.request.user)
    user.photo = profile.photo
    user.name = profile.name
    user.userid = socket.request.user.id
    user.login = true
  } else {
    user.userid = null
    user.name = 'Guest ' + chance.animal()
    user.login = false
  }
}

function canEditNote (notePermission, noteOwnerId, currentUserId) {
  switch (notePermission) {
    case 'freely':
      return true
    case 'editable':
    case 'limited':
      // only login user can change
      return !!currentUserId
    case 'locked':
    case 'private':
    case 'protected':
      // only owner can change
      return noteOwnerId === currentUserId
  }
}

function ifMayEdit (socket, callback) {
  const note = getNoteFromNotePool(socket.noteId)
  if (!note) return
  const mayEdit = canEditNote(note.permission, note.owner, socket.request.user.id)
  // if user may edit and this is a text operation
  if (socket.origin === 'operation' && mayEdit) {
    // save for the last change user id
    if (socket.request.user && socket.request.user.logged_in) {
      note.lastchangeuser = socket.request.user.id
    } else {
      note.lastchangeuser = null
    }
  }
  return callback(mayEdit)
}

// TODO: test it
function operationCallback (socket, operation) {
  var noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  var note = notes[noteId]
  var userId = null
  // save authors
  if (socket.request.user && socket.request.user.logged_in) {
    var user = users[socket.id]
    if (!user) return
    userId = socket.request.user.id
    if (!note.authors[userId]) {
      models.Author.findOrCreate({
        where: {
          noteId: noteId,
          userId: userId
        },
        defaults: {
          noteId: noteId,
          userId: userId,
          color: user.color
        }
      }).spread(function (author, created) {
        if (author) {
          note.authors[author.userId] = {
            userid: author.userId,
            color: author.color,
            photo: user.photo,
            name: user.name
          }
        }
      }).catch(function (err) {
        return logger.error('operation callback failed: ' + err)
      })
    }
    note.tempUsers[userId] = Date.now()
  }
  // save authorship - use timer here because it's an O(n) complexity algorithm
  setImmediate(function () {
    note.authorship = models.Note.updateAuthorshipByOperation(operation, userId, note.authorship)
  })
}

// TODO: test it
function updateHistory (userId, note, time) {
  var noteId = note.alias ? note.alias : models.Note.encodeNoteId(note.id)
  if (note.server) history.updateHistory(userId, noteId, note.server.document, time)
}

function getUniqueColorPerNote (noteId, maxAttempt = 10) {
  // random color
  let color = randomcolor()
  if (!notes[noteId]) return color

  const maxrandomcount = maxAttempt
  let randomAttemp = 0
  let found = false
  do {
    Object.keys(notes[noteId].users).forEach(userId => {
      if (notes[noteId].users[userId].color === color) {
        found = true
      }
    })
    if (found) {
      color = randomcolor()
      randomAttemp++
    }
  } while (found && randomAttemp < maxrandomcount)
  return color
}

function queueForConnect (socket) {
  connectProcessQueue.push(socket.id, async function () {
    try {
      const noteId = await exports.parseNoteIdFromSocketAsync(socket)
      if (!noteId) {
        return exports.failConnection(404, 'note id not found', socket)
      }
      // store noteId in this socket session
      socket.noteId = noteId
      // initialize user data
      // random color
      var color = getUniqueColorPerNote(noteId)
      // create user data
      users[socket.id] = {
        id: socket.id,
        address: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
        'user-agent': socket.handshake.headers['user-agent'],
        color: color,
        cursor: null,
        login: false,
        userid: null,
        name: null,
        idle: false,
        type: null
      }
      exports.updateUserData(socket, users[socket.id])
      try {
        if (!isNoteExistsInPool(noteId)) {
          const note = await fetchFullNoteAsync(noteId)
          if (!note) {
            logger.error('note not found')
            // emit error info
            socket.emit('info', {
              code: 404
            })
            return socket.disconnect(true)
          }
          getNotePool()[noteId] = makeNewServerNote(note)
        }
        // if no valid info provided will drop the client
        if (!socket || !notes[noteId] || !users[socket.id]) {
          if (notes[noteId]) delete notes[noteId]
          if (users[socket.id]) delete users[socket.id]
          return
        }
        // check view permission
        if (!exports.checkViewPermission(socket.request, notes[noteId])) {
          if (notes[noteId]) delete notes[noteId]
          if (users[socket.id]) delete users[socket.id]
          logger.error('connection forbidden')
          // emit error info
          socket.emit('info', {
            code: 403
          })
          return socket.disconnect(true)
        }
        const note = notes[noteId]
        const user = users[socket.id]
        // update user color to author color
        if (note.authors[user.userid]) {
          user.color = users[socket.id].color = note.authors[user.userid].color
        }
        note.users[socket.id] = user
        note.socks.push(socket)
        note.server.addClient(socket)
        note.server.setName(socket, user.name)
        note.server.setColor(socket, user.color)

        // update user note history
        exports.updateHistory(user.userid, note)

        exports.emitOnlineUsers(socket)
        exports.emitRefresh(socket)

        const socketClient = new RealtimeClientConnection(socket)
        socketClient.registerEventHandler()

        if (config.debug) {
          const noteId = socket.noteId
          logger.info('SERVER connected a client to [' + noteId + ']:')
          logger.info(JSON.stringify(user))
          getStatus().then(function (data) {
            logger.info(JSON.stringify(data))
          })
        }
      } catch (err) {
        logger.error(err)
        // emit error info
        socket.emit('info', {
          code: 500
        })
        return socket.disconnect(true)
      }
    } catch (err) {
      return exports.failConnection(500, err, socket)
    }
  })
}

function connection (socket) {
  if (realtime.maintenance) return
  queueForConnect(socket)
}

// TODO: test it
function terminate () {
  disconnectProcessQueue.stop()
  connectProcessQueue.stop()
  updateDirtyNoteJob.stop()
}

exports = module.exports = realtime
exports.extractNoteIdFromSocket = extractNoteIdFromSocket
exports.updateNote = updateNote
exports.failConnection = failConnection
exports.updateUserData = updateUserData
exports.emitRefresh = emitRefresh
exports.emitUserStatus = emitUserStatus
exports.emitOnlineUsers = emitOnlineUsers
exports.checkViewPermission = checkViewPermission
exports.getUserFromUserPool = getUserFromUserPool
exports.buildUserOutData = buildUserOutData
exports.emitCheck = emitCheck
exports.disconnectSocketOnNote = disconnectSocketOnNote
exports.queueForDisconnect = queueForDisconnect
exports.terminate = terminate
exports.updateHistory = updateHistory
exports.ifMayEdit = ifMayEdit
exports.parseNoteIdFromSocketAsync = parseNoteIdFromSocketAsync
exports.disconnectProcessQueue = disconnectProcessQueue
exports.users = users
exports.getUserPool = getUserPool

exports.notes = notes
exports.getNotePool = getNotePool
exports.getNotePoolSize = getNotePoolSize
exports.isNoteExistsInPool = isNoteExistsInPool
exports.addNote = addNote
exports.getNoteFromNotePool = getNoteFromNotePool
exports.deleteNoteFromPool = deleteNoteFromPool
exports.deleteAllNoteFromPool = deleteAllNoteFromPool

exports.saveRevisionJob = saveRevisionJob
