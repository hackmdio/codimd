'use strict'

const Router = require('express').Router

const folder = require('../folder')
const folderRouter = module.exports = Router()

// list folders belonged to user
folderRouter.get('/folders', folder.getAllFolders)
// list notes belonged to the specific folder
folderRouter.get('/folders/:folderId/notes', folder.getNotes)
// create new folder
folderRouter.get('/folders/:folderId/new/folder/:newName', folder.folderNew)
// delete folder
folderRouter.get('/folders/:folderId/delete', folder.folderDelete)
// rename folder
folderRouter.get('/folders/:folderId/rename/:newName', folder.folderRename)
// create note
folderRouter.get('/folders/:folderId/new/note', folder.folderNewNote)
// move note
folderRouter.get('/:noteId/move/:folderId', folder.folderMoveNote)
// search folders and notes containing keyword
folderRouter.get('/search/:keyword', folder.folderSearch)
