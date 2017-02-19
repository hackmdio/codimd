'use strict'

const Router = require('express').Router

const folder = require('../folder')
const folderRouter = module.exports = Router()

// list folders belonged to user
folderRouter.get('/folders', folder.getAllFolders)
// list notes belonged to the specific folder
folderRouter.get('/folders/:folderId/notes', folder.getNotes)
// rename folder
folderRouter.get('/folders/:folderId/rename/:newName', folder.folderRename)
// move note
folderRouter.get('/:noteId/move/:folderId', folder.folderMoveNote)
// search folders and notes containing keyword
folderRouter.get('/search/:keyword', folder.folderSearch)
