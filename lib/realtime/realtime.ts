// realtime
// external modules
import cookie from "cookie";
import cookieParser from "cookie-parser";
import url from "url";
import randomcolor from "randomcolor";
import Chance from "chance";
import moment from "moment";
import {get} from "lodash";
import SocketIO from "socket.io";

// core
import config from "../config";
import {logger} from "../logger";
import * as history from "../history";
import {Author, Note, User} from "../models";
import {Authorship, UserProfile} from "../models/baseModel";

// ot
import ot from "ot";

import {ProcessQueue} from "./processQueue";
import {CursorData, RealtimeClientConnection} from "./realtimeClientConnection";
import {UpdateDirtyNoteJob} from "./realtimeUpdateDirtyNoteJob";
import {CleanDanglingUserJob} from "./realtimeCleanDanglingUserJob";
import {SaveRevisionJob} from "./realtimeSaveRevisionJob";


export interface RealtimeUserData {
  id?: string
  color?: string
  address?: string
  'user-agent'?: string
  photo?: string

  cursor?: {line: number, ch: number}
  login?: boolean
  userid?: string
  name?: string

  // user status
  idle: boolean
  type: 'xs' | 'sm' | 'md' | 'lg'
}

interface RealtimeAuthorData {
  userid: string
  color: string
  photo: string
  name: string
}

export interface RealtimeNoteData {
  id: string,
  alias?: string,
  title?: string,
  // owner id
  owner?: string,
  ownerprofile?: UserProfile
  permission?: string
  // last change user id
  lastchangeuser?: string
  lastchangeuserprofile?: UserProfile

  socks: SocketIO.Socket[]
  users: Record<string, RealtimeUserData>
  //???
  tempUsers: any

  createtime: number
  updatetime: number

  // type: ot.EditorSocketIOServer
  server: any

  authors: Record<string, RealtimeAuthorData>
  authorship: Authorship[]
}


const chance = new Chance()

export let io: SocketIO.Server = null
export let maintenance = true

export function setSocketIo(socketIO: SocketIO.Server): void {
  io = socketIO
}

export function setMaintenance(isMaintenance: boolean): void {
  maintenance = isMaintenance
}

// public
const connectProcessQueue = new ProcessQueue({})
export const disconnectProcessQueue = new ProcessQueue({})
const updateDirtyNoteJob = new UpdateDirtyNoteJob(exports)
const cleanDanglingUserJob = new CleanDanglingUserJob(exports)
export const saveRevisionJob = new SaveRevisionJob(exports)

// TODO: test it
export function onAuthorizeSuccess(data: Record<null, null>, accept: (err?: Error | null, accepted?: boolean) => void): void {
  accept()
}

// TODO: test it
export function onAuthorizeFail(data: Record<null, null>, message: string, error: boolean, accept: (err?: Error | null, accepted?: boolean) => void): void {
  accept() // accept whether authorize or not to allow anonymous usage
}

// TODO: test it
// secure the origin by the cookie
export function secure(socket: SocketIO.Socket, next: (err?: Error | null) => void): void {
  try {
    const handshakeData = socket.request
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
export function emitCheck(note: RealtimeNoteData): void {
  const out = {
    title: note.title,
    updatetime: note.updatetime,
    lastchangeuser: note.lastchangeuser,
    lastchangeuserprofile: note.lastchangeuserprofile,
    authors: note.authors,
    authorship: note.authorship
  }
  io.to(note.id).emit('check', out)
}

// actions
export const users: Record<string, RealtimeUserData> = {}
export const notes: Record<string, RealtimeNoteData> = {}

export function getNotePool(): Record<string, RealtimeNoteData> {
  return notes
}

export function isNoteExistsInPool(noteId: string): boolean {
  return !!notes[noteId]
}

export function addNote(note: RealtimeNoteData): boolean {
  if (exports.isNoteExistsInPool(note.id)) return false
  notes[note.id] = note
  return true
}

export function getNotePoolSize(): number {
  return Object.keys(notes).length
}

export function deleteNoteFromPool(noteId: string): void {
  delete notes[noteId]
}

export function deleteAllNoteFromPool(): void {
  Object.keys(notes).forEach(noteId => {
    delete notes[noteId]
  })
}

export function getNoteFromNotePool(noteId: string): RealtimeNoteData | null {
  return notes[noteId]
}

export function getUserPool(): Record<string, RealtimeUserData> {
  return users
}

export function getUserFromUserPool(userId: string): RealtimeUserData | null {
  return users[userId]
}

disconnectProcessQueue.start()
updateDirtyNoteJob.start()
cleanDanglingUserJob.start()
saveRevisionJob.start()

export function disconnectSocketOnNote(note: RealtimeNoteData): void {
  note.socks.forEach((sock) => {
    if (sock) {
      sock.emit('delete')
      setImmediate(() => {
        sock.disconnect(true)
      })
    }
  })
}

export function updateNote(note: RealtimeNoteData, callback: (err: Error | null, note: Note) => void): void {
  _updateNoteAsync(note).then(_note => {
    callback(null, _note)
  }).catch((err) => {
    logger.error(err)
    return callback(err, null)
  })
}

function findNoteByIdAsync(id: string): Promise<Note> {
  return Note.findOne({
    where: {
      id: id
    }
  })
}

function updateHistoryForEveryUserCollaborateNote(note: RealtimeNoteData): void {
  // update history to every user in this note
  const tempUsers = Object.assign({}, note.tempUsers)
  note.tempUsers = {}
  // update history should async function, but in there return values is not matter
  Object.keys(tempUsers).forEach(function (key) {
    exports.updateHistory(key, note, tempUsers[key])
  })
}

async function getUserProfileByIdAsync(id: string): Promise<UserProfile> {
  const user = await User.findOne({
    where: {
      id: id
    }
  })
  if (!user) return null
  return User.getProfile(user)
}

class UserNotFoundException extends Error {
  constructor() {
    super('user not found')
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

async function getLastChangeUserProfileAsync(currentLastChangeUserId, lastChangeUserIdInDatabase, lastChangeUserProfileInDatabase) {
  if (!currentLastChangeUserId) return null
  if (currentLastChangeUserId === lastChangeUserIdInDatabase) return lastChangeUserProfileInDatabase
  const profile = await getUserProfileByIdAsync(currentLastChangeUserId)
  if (!profile) {
    throw new UserNotFoundException()
  }
  return profile
}

function buildNoteUpdateData(note) {
  const body = note.server.document
  const title = note.title = Note.parseNoteTitle(body)
  return {
    title: title,
    content: body,
    authorship: note.authorship,
    lastchangeuserId: note.lastchangeuser,
    lastchangeAt: Date.now()
  }
}

async function _updateNoteAsync(note: RealtimeNoteData) {
  let noteModel = await findNoteByIdAsync(note.id)
  if (!noteModel) return null

  updateHistoryForEveryUserCollaborateNote(note)

  try {
    note.lastchangeuserprofile = await getLastChangeUserProfileAsync(
      note.lastchangeuser,
      noteModel.lastchangeuserId,
      note.lastchangeuser
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

interface StatusData {
  onlineNotes: number
  onlineUsers: number
  distinctOnlineUsers: number
  notesCount: number
  registeredUsers: number
  onlineRegisteredUsers: number
  distinctOnlineRegisteredUsers: number
  isConnectionBusy: boolean
  connectionSocketQueueLength: number
  isDisconnectBusy: boolean
  disconnectSocketQueueLength: number
}

// TODO: test it
export function getStatus(): Promise<StatusData> {
  return Note.count()
    .then(function (notecount: number) {
      const distinctaddresses = []
      const regaddresses = []
      const distinctregaddresses = []
      Object.keys(users).forEach(function (key) {
        const user = users[key]
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

      return User.count()
        .then(function (regcount: number) {
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
export function isReady(): boolean {
  return io &&
    Object.keys(notes).length === 0 && Object.keys(users).length === 0 &&
    connectProcessQueue.queue.length === 0 && !connectProcessQueue.lock &&
    disconnectProcessQueue.queue.length === 0 && !disconnectProcessQueue.lock
}

function parseUrl(data) {
  try {
    if (url.URL) {
      return new url.URL(data)
    } else {
      // fallback legacy api
      // eslint-disable-next-line
      return url.parse(data)
    }
  } catch (e) {
    //  just ignore
  }
  return null
}

export function extractNoteIdFromSocket(socket: SocketIO.Socket): string | null | boolean {
  function extractNoteIdFromReferer(referer: string): string | null | boolean {
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

export const parseNoteIdFromSocketAsync = async function (socket: SocketIO.Socket): Promise<string | null> {
  const noteId = extractNoteIdFromSocket(socket)
  if (!noteId) {
    return null
  }

  return new Promise((resolve, reject) => {
    Note.parseNoteId(noteId as string, function (err, id) {
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
export function emitOnlineUsers(socket: SocketIO.Socket): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const users: RealtimeClientUserData[] = []
  Object.keys(notes[noteId].users).forEach(function (key) {
    const user = notes[noteId].users[key]
    if (user) {
      users.push(buildUserOutData(user))
    }
  })
  const out = {
    users: users
  }
  io.to(noteId).emit('online users', out)
}

// TODO: test it
export function emitUserStatus(socket: SocketIO.Socket): void {
  const noteId = socket.noteId
  const user = users[socket.id]
  if (!noteId || !notes[noteId] || !user) return
  const out = buildUserOutData(user)
  socket.broadcast.to(noteId).emit('user status', out)
}

// TODO: test it
export function emitRefresh(socket: SocketIO.Socket): void {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const note = notes[noteId]
  const out = {
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

export function checkViewPermission(req, note) {
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
async function fetchFullNoteAsync(noteId: string): Promise<Note> {
  return Note.findOne({
    where: {
      id: noteId
    },
    include: [{
      model: User,
      as: 'owner'
    }, {
      model: User,
      as: 'lastchangeuser'
    }, {
      model: Author,
      as: 'authors',
      include: [{
        model: User,
        as: 'user'
      }]
    }]
  })
}

function buildAuthorProfilesFromNote(noteAuthors: Author[]): Record<string, RealtimeAuthorData> {
  const authors: Record<string, RealtimeAuthorData> = {}
  noteAuthors.forEach((author) => {
    const profile = User.getProfile(author.user as User)
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

function makeNewServerNote(note) {
  const authors = buildAuthorProfilesFromNote(note.authors)
  const otServer = new ot.EditorSocketIOServer(note.content, [], note.id, ifMayEdit, operationCallback)
  otServer.debug = config.debug
  otServer.setLogger(logger)
  otServer.setDocumentMaxLength(config.documentmaxlength)

  return {
    id: note.id,
    alias: note.alias,
    title: note.title,
    owner: note.ownerId,
    ownerprofile: note.owner ? User.getProfile(note.owner) : null,
    permission: note.permission,
    lastchangeuser: note.lastchangeuserId,
    lastchangeuserprofile: note.lastchangeuser ? User.getProfile(note.lastchangeuser) : null,
    socks: [],
    users: {},
    tempUsers: {},
    createtime: moment(note.createdAt).valueOf(),
    updatetime: moment(note.lastchangeAt).valueOf(),
    server: otServer,
    authors: authors,
    authorship: note.authorship
  }
}

// TODO: test it
export function failConnection(code: number, err: string | Error, socket: SocketIO.Socket): void {
  logger.error(err)
  // emit error info
  socket.emit('info', {
    code: code
  })
  socket.disconnect(true)
  return
}

export function queueForDisconnect(socket: SocketIO.Socket): void {
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
          exports.updateNote(note, function (err) {
            if (err) {
              logger.error('disconnect note failed: ' + err)
              return
            }
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

interface RealtimeClientUserData {
  id?: string
  login?: boolean
  userid?: string
  photo?: string
  color?: string
  cursor?: CursorData
  name?: string
  idle?: boolean
  type?: string
}

export function buildUserOutData(user: RealtimeUserData): RealtimeClientUserData {
  const out = {
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
export function updateUserData(socket: SocketIO.Socket, user): void {
  // retrieve user data from passport
  if (socket.request.user && socket.request.user.logged_in) {
    const profile = User.getProfile(socket.request.user)
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

function canEditNote(notePermission: string, noteOwnerId: string, currentUserId: string): boolean {
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

export function ifMayEdit(socket: SocketIO.Socket, callback: (canEdit: boolean) => void): void {
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
function operationCallback(socket: SocketIO.Socket, operation: any) {
  const noteId = socket.noteId
  if (!noteId || !notes[noteId]) return
  const note = notes[noteId]
  let userId = null
  // save authors
  if (socket.request.user && socket.request.user.logged_in) {
    const user = users[socket.id]
    if (!user) return
    userId = socket.request.user.id
    if (!note.authors[userId]) {
      Author.findOrCreate({
        where: {
          noteId: noteId,
          userId: userId
        },
        defaults: {
          noteId: noteId,
          userId: userId,
          color: user.color
        }
      }).spread(function (author) {
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
  note.server.isDirty = true
  // save authorship - use timer here because it's an O(n) complexity algorithm
  setImmediate(function () {
    note.authorship = Note.updateAuthorshipByOperation(operation, userId, note.authorship)
  })
}

// TODO: test it
export function updateHistory(userId: string, note, time?: number): void {
  const noteId = note.alias ? note.alias : Note.encodeNoteId(note.id)
  if (note.server) history.updateHistory(userId, noteId, note.server.document, time)
}

function getUniqueColorPerNote(noteId: string, maxAttempt = 10): string {
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

function queueForConnect(socket: SocketIO.Socket) {
  connectProcessQueue.push(socket.id, async function () {
    try {
      const noteId = await exports.parseNoteIdFromSocketAsync(socket) as string
      if (!noteId) {
        return exports.failConnection(404, 'note id not found', socket)
      }
      // store noteId in this socket session
      socket.noteId = noteId
      // initialize user data
      // random color
      const color = getUniqueColorPerNote(noteId)
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

export function connection(socket: SocketIO.Socket): void {
  if (maintenance) return
  queueForConnect(socket)
}

// TODO: test it
export function terminate(): void {
  disconnectProcessQueue.stop()
  connectProcessQueue.stop()
  updateDirtyNoteJob.stop()
}
