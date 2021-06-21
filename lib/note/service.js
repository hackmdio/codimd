
'use strict'
const { Note, User, ArchivedNoteAlias, sequelize } = require('../models')
const config = require('../config')
const logger = require('../logger')
const realtime = require('../realtime/realtime')

const EXIST_WEB_ROUTES = ['', 'new', 'me', 'history', '403', '404', '500', 'config']
const FORBIDDEN_ALIASES = [...EXIST_WEB_ROUTES, ...config.forbiddenNoteIDs]

exports.getNote = async (originAliasOrNoteId, { includeUser } = { includeUser: false }) => {
  const id = await Note.parseNoteIdAsync(originAliasOrNoteId)

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

  const note = await Note.findOne({
    where: {
      id: id
    },
    include: includes
  })
  return note
}

exports.canViewNote = (note, isLogin, userId) => {
  if (note.permission === 'private') {
    return note.ownerId === userId
  }
  if (note.permission === 'limited' || note.permission === 'protected') {
    return isLogin
  }
  return true
}

exports.getMyNoteList = async (userId, callback) => {
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

const sanitizeAlias = (alias) => {
  return alias.replace(/( |\/)/g, '')
}

const checkAliasValid = async (originAliasOrNoteId, alias) => {
  const sanitizedAlias = sanitizeAlias(alias)
  if (FORBIDDEN_ALIASES.includes(sanitizedAlias)) {
    return {
      isValid: false,
      errorMessage: 'The url is exist.'
    }
  }

  if (!/^[0-9a-z-_]+$/.test(alias)) {
    return {
      isValid: false,
      errorMessage: 'The url must be lowercase letters, decimal digits, hyphen or underscore.'
    }
  }

  const conflictNote = await exports.getNote(alias)
    .catch((err) => { throw err })

  const note = await exports.getNote(originAliasOrNoteId)
    .catch((err) => { throw err })

  if (conflictNote && conflictNote.id !== note.id) {
    return {
      isValid: false,
      errorMessage: 'The url is exist.'
    }
  }

  return {
    isValid: true
  }
}

exports.updateAlias = async (originAliasOrNoteId, alias) => {
  const sanitizedAlias = sanitizeAlias(alias)
  const note = await exports.getNote(originAliasOrNoteId)
    .catch((err) => { throw err })

  const { isValid, errorMessage } = await checkAliasValid(originAliasOrNoteId, alias)
  if (!isValid) {
    return {
      isSuccess: false,
      errorMessage
    }
  }

  const t = await sequelize.transaction()
  if (note.alias) {
    const archivedAlias = await ArchivedNoteAlias.findOne({
      where: {
        alias: note.alias
      }
    })
      .catch(async err => { throw err })

    if (!archivedAlias) {
      await ArchivedNoteAlias.create({
        noteId: note.id,
        alias: note.alias
      }, { transaction: t })
        .catch(async err => {
          await t.rollback()
          throw Error('Add archived note alias failed. ' + err.message)
        })
    }
  }

  const updatedNote = await note.update({
    alias: sanitizedAlias,
    lastchangeAt: Date.now()
  }, { transaction: t })
    .catch(async err => {
      await t.rollback()
      throw Error('Write note content error. ' + err.message)
    })

  await t.commit()

  realtime.io.to(updatedNote.id)
    .emit('alias updated', {
      alias: updatedNote.alias
    })

  return {
    isSuccess: true
  }
}
