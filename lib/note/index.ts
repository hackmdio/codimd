import {Request, Response} from "express";
import config from "../config";
import {historyDelete, updateHistory} from "../history";
import {logger} from "../logger";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {Note, Revision, User} from "../models";

import * as realtime from "../realtime/realtime";


import {errorForbidden, errorInternalError, errorNotFound, newCheckViewPermission, responseCodiMD} from "../response";
import {createNoteWithRevision} from "../services/note";
import {
  actionDownload,
  actionGist,
  actionInfo,
  actionPandoc,
  actionPDF,
  actionPublish,
  actionRevision,
  actionSlide
} from "./noteActions";

async function getNoteById(noteId, {includeUser} = {includeUser: false}): Promise<Note> {
  const id = await Note.parseNoteIdAsync(noteId)

  const includes = []

  if (includeUser) {
    includes.push({
      model: User,
      as: 'owner'
    }, {
      model: User,
      as: 'lastchangeuser'
    })
  }

  return Note.findOne({
    where: {
      id: id
    },
    include: includes
  });
}

async function createNote(userId, noteAlias) {
  if (!config.allowAnonymous && !userId) {
    throw new Error('can not create note')
  }

  const note = await createNoteWithRevision({
    ownerId: userId,
    alias: noteAlias
  })

  if (userId) {
    updateHistory(userId, note.id)
  }

  return note
}

// controller
export async function showNote(req: Request, res: Response): Promise<void> {
  const noteId = req.params.noteId
  const userId = req.user ? req.user.id : null

  let note = await getNoteById(noteId)

  if (!note) {
    // if allow free url enable, auto create note
    if (!config.allowFreeURL || config.forbiddenNoteIDs.includes(noteId)) {
      return errorNotFound(req, res)
    } else if (!config.allowAnonymous && !userId) {
      return errorForbidden(req, res)
    }
    note = await createNote(userId, noteId)
  }

  if (!newCheckViewPermission(note, req.isAuthenticated(), userId)) {
    return errorForbidden(req, res)
  }

  // force to use note id
  const id = Note.encodeNoteId(note.id)
  if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) {
    return res.redirect(config.serverURL + '/' + (note.alias || id))
  }
  return responseCodiMD(res, note)
}

function canViewNote(note: Note, isLogin: boolean, userId: string | null): boolean {
  if (note.permission === 'private') {
    return note.ownerId === userId
  }
  if (note.permission === 'limited' || note.permission === 'protected') {
    return isLogin
  }
  return true
}

export async function showPublishNote(req: Request, res: Response): Promise<void> {
  const shortid = req.params.shortid

  const note = await getNoteById(shortid, {
    includeUser: true
  })

  if (!note) {
    return errorNotFound(req, res)
  }

  if (!canViewNote(note, req.isAuthenticated(), req.user ? req.user.id : null)) {
    return errorForbidden(req, res)
  }

  if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
    return res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
  }

  await note.increment('viewcount')

  const body = note.content
  const extracted = Note.extractMeta(body)
  const markdown = extracted.markdown
  const meta = Note.parseMeta(extracted.meta)
  const createTime = note.createdAt
  const updateTime = note.lastchangeAt
  const title = Note.generateWebTitle(meta.title || Note.decodeTitle(note.title))

  const data = {
    title: title,
    description: meta.description || (markdown ? Note.generateDescription(markdown) : null),
    image: meta.image,
    viewcount: note.viewcount,
    createtime: createTime,
    updatetime: updateTime,
    body: body,
    owner: note.owner ? note.owner.id : null,
    ownerprofile: note.owner ? User.getProfile(note.owner as User) : null,
    lastchangeuser: note.lastchangeuser ? note.lastchangeuser.id : null,
    lastchangeuserprofile: note.lastchangeuser ? User.getProfile(note.lastchangeuser as User) : null,
    robots: meta.robots || false, // default allow robots
    GA: meta.GA,
    disqus: meta.disqus,
    cspNonce: res.locals.nonce
  }

  res.set({
    'Cache-Control': 'private' // only cache by client
  })

  res.render('pretty.ejs', data)
}

export async function noteActions(req: Request, res: Response): Promise<void> {
  const noteId = req.params.noteId

  const note = await getNoteById(noteId)

  if (!note) {
    return errorNotFound(req, res)
  }

  if (!canViewNote(note, req.isAuthenticated(), req.user ? req.user.id : null)) {
    return errorForbidden(req, res)
  }

  const action = req.params.action
  switch (action) {
    case 'publish':
    case 'pretty': // pretty deprecated
      return actionPublish(req, res, note)
    case 'slide':
      return actionSlide(req, res, note)
    case 'download':
      actionDownload(req, res, note)
      break
    case 'info':
      actionInfo(req, res, note)
      break
    case 'pdf':
      if (config.allowPDFExport) {
        actionPDF(req, res, note)
      } else {
        logger.error('PDF export failed: Disabled by config. Set "allowPDFExport: true" to enable. Check the documentation for details')
        errorForbidden(req, res)
      }
      break
    case 'gist':
      actionGist(req, res, note)
      break
    case 'revision':
      actionRevision(req, res, note)
      break
    case 'pandoc':
      actionPandoc(req, res, note)
      break
    default:
      return res.redirect(config.serverURL + '/' + noteId)
  }
}

async function getMyNoteList(userId, callback) {
  const myNotes = await Note.findAll({
    where: {
      ownerId: userId
    }
  })
  if (!myNotes) {
    return callback(null, null)
  }
  try {
    const myNoteList = myNotes.map(note => ({
      id: Note.encodeNoteId(note.id),
      text: note.title,
      tags: Note.parseNoteInfo(note.content).tags,
      createdAt: note.createdAt,
      lastchangeAt: note.lastchangeAt,
      shortId: note.shortid
    }))
    if (config.debug) {
      logger.info('Parse myNoteList success: ' + userId)
    }
    return callback(null, myNoteList)
  } catch (err) {
    logger.error('Parse myNoteList failed')
    return callback(err, null)
  }
}

export function listMyNotes(req: Request, res: Response): void {
  if (req.isAuthenticated()) {
    getMyNoteList(req.user.id, (err, myNoteList) => {
      if (err) return errorInternalError(req, res)
      if (!myNoteList) return errorNotFound(req, res)
      res.send({
        myNotes: myNoteList
      })
    })
  } else {
    return errorForbidden(req, res)
  }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  if (req.isAuthenticated()) {
    const noteId = await Note.parseNoteIdAsync(req.params.noteId)
    try {
      const destroyed = await Note.destroy({
        where: {
          id: noteId,
          ownerId: req.user.id
        }
      })
      if (!destroyed) {
        logger.error('Delete note failed: Make sure the noteId and ownerId are correct.')
        return errorNotFound(req, res)
      }

      historyDelete(req, res)

      if (realtime.isNoteExistsInPool(noteId)) {
        const note = realtime.getNoteFromNotePool(noteId)
        realtime.disconnectSocketOnNote(note)
      }

      res.send({
        status: 'ok'
      })
    } catch (err) {
      logger.error('Delete note failed: Internal Error.')
      return errorInternalError(req, res)
    }
  } else {
    return errorForbidden(req, res)
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  if (req.isAuthenticated() || config.allowAnonymousEdits) {
    const noteId = await Note.parseNoteIdAsync(req.params.noteId)
    try {
      const note = await Note.findOne({
        where: {
          id: noteId
        }
      })
      if (!note) {
        logger.error('Update note failed: Can\'t find the note.')
        return errorNotFound(req, res)
      }

      if (realtime.isNoteExistsInPool(noteId)) {
        logger.error('Update note failed: There are online users opening this note.')
        res.status(403).json({status: 'error', message: 'Update API can only be used when no users is online'})
        return
      }

      const now = Date.now()
      const content = req.body.content
      const updated = await note.update({
        title: Note.parseNoteTitle(content),
        content: content,
        lastchangeAt: now,
        authorship: [
          [
            req.isAuthenticated() ? req.user.id : null,
            0,
            content.length,
            now,
            now
          ]
        ]
      })

      if (!updated) {
        logger.error('Update note failed: Write note content error.')
        return errorInternalError(req, res)
      }

      if (req.isAuthenticated()) {
        updateHistory(req.user.id, noteId as string, content)
      }

      Revision.saveNoteRevision(note, (err, revision) => {
        if (err) {
          logger.error(err)
          return errorInternalError(req, res)
        }
        if (!revision) return errorNotFound(req, res)
        res.send({
          status: 'ok'
        })
      })
    } catch (err) {
      logger.error(err.stack)
      logger.error('Update note failed: Internal Error.')
      return errorInternalError(req, res)
    }
  } else {
    return errorForbidden(req, res)
  }
}
