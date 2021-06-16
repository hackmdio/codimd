import {Router} from "express";
import {markdownParser, urlencodedParser, wrap} from "./utils";

// load controller
import * as indexController from "./homepage";
import * as errorPageController from "./errorPage";
import * as statusController from "./status";
import * as historyController from "./history";
import * as userController from "./user";
import * as noteController from "./note";

import * as response from "./response";
import bodyParser from "body-parser";

const appRouter = Router()

// register route

// get index
appRouter.get('/', wrap(indexController.showIndex))

// ----- error page -----
// get 403 forbidden
appRouter.get('/403', errorPageController.errorForbidden)
// get 404 not found
appRouter.get('/404', errorPageController.errorNotFound)
// get 500 internal error
appRouter.get('/500', errorPageController.errorInternalError)

appRouter.get('/config', statusController.getConfig)

// register auth module
// eslint-disable-next-line @typescript-eslint/no-var-requires
appRouter.use(require('./auth'))

// get history
appRouter.get('/history', historyController.historyGet)
// post history
appRouter.post('/history', urlencodedParser, historyController.historyPost)
// post history by note id
appRouter.post('/history/:noteId', urlencodedParser, historyController.historyPost)
// delete history
appRouter.delete('/history', historyController.historyDelete)
// delete history by note id
appRouter.delete('/history/:noteId', historyController.historyDelete)

// user
// get me info
appRouter.get('/me', wrap(userController.getMe))

// delete the currently authenticated user
appRouter.get('/me/delete/:token?', wrap(userController.deleteUser))

// export the data of the authenticated user
appRouter.get('/me/export', userController.exportMyData)

appRouter.get('/user/:username/avatar.svg', userController.getMyAvatar)

// register image upload module
// eslint-disable-next-line @typescript-eslint/no-var-requires
appRouter.use(require('./imageRouter'))

// get new note
appRouter.get('/new', response.newNote)
// post new note with content
appRouter.post('/new', markdownParser, response.newNote)
// get publish note
appRouter.get('/s/:shortid', noteController.showPublishNote)
// publish note actions
appRouter.get('/s/:shortid/:action', response.publishNoteActions)
// get publish slide
appRouter.get('/p/:shortid', response.showPublishSlide)
// publish slide actions
appRouter.get('/p/:shortid/:action', response.publishSlideActions)
// gey my note list
appRouter.get('/api/notes/myNotes', noteController.listMyNotes)
// delete note by id
appRouter.delete('/api/notes/:noteId', noteController.deleteNote)
// update note content by id
appRouter.put('/api/notes/:noteId', bodyParser.json(), noteController.updateNote)
// get note by id
appRouter.get('/:noteId', wrap(noteController.showNote))
// note actions
appRouter.get('/:noteId/:action', noteController.noteActions)
// note actions with action id
appRouter.get('/:noteId/:action/:actionId', noteController.noteActions)

export const router = appRouter
