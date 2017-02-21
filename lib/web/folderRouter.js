'use strict'

const Router = require('express').Router

const folder = require('../folder')
const folderRouter = module.exports = Router()

// move note
folderRouter.get('/:noteId/move/:folderId', folder.folderMoveNote)
