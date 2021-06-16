// response
// external modules
import * as request from "request";
import {Request, Response} from "express";
import {Includeable} from "sequelize";
// core
import config from "./config";
import {logger} from "./logger";
import {Note, User} from "./models";
import {createNoteWithRevision} from "./services/note";
import * as utils from "./utils";
import * as  history from "./history";

export function errorForbidden(req: Request, res: Response): void {
  if (req.user) {
    responseError(res, 403, 'Forbidden', 'oh no.')
  } else {
    const nextURL = new URL('', config.serverURL)
    nextURL.search = (new URLSearchParams({next: req.originalUrl})).toString()
    req.flash('error', 'You are not allowed to access this page. Maybe try logging in?')
    res.redirect(nextURL.toString())
  }
}

export function errorNotFound(req: Request, res: Response): void {
  responseError(res, 404, 'Not Found', 'oops.')
}

export function errorBadRequest(req: Request, res: Response): void {
  responseError(res, 400, 'Bad Request', 'something not right.')
}

export function errorTooLong(req: Request, res: Response): void {
  responseError(res, 413, 'Payload Too Large', 'Shorten your note!')
}

export function errorInternalError(req: Request, res: Response): void {
  responseError(res, 500, 'Internal Error', 'wtf.')
}

export function errorServiceUnavailable(req: Request, res: Response): void {
  res.status(503).send('I\'m busy right now, try again later.')
}

export function responseError(res: Response, code: number, detail: string, msg: string): void {
  res.status(code).render('error.ejs', {
    title: code + ' ' + detail + ' ' + msg,
    code: code,
    detail: detail,
    msg: msg
  })
}

export function responseCodiMD(res: Response, note: Note): void {
  const body = note.content
  const extracted = Note.extractMeta(body)
  const meta = Note.parseMeta(extracted.meta)
  let title = Note.decodeTitle(note.title)
  title = Note.generateWebTitle(meta.title || title)
  res.set({
    'Cache-Control': 'private', // only cache by client
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.render('codimd.ejs', {
    title: title
  })
}

function updateHistory(userId, note, document, time?: number) {
  const noteId = note.alias ? note.alias : Note.encodeNoteId(note.id)
  history.updateHistory(userId, noteId, document, time)
  logger.info('history updated')
}

type NewNoteReq = Request & {
  alias?: string
}

export function newNote(req: NewNoteReq, res: Response): void {
  let owner = null
  let body = ''
  if (req.body && req.body.length > config.documentMaxLength) {
    return errorTooLong(req, res)
  } else if (req.body) {
    body = req.body
  }
  body = body.replace(/[\r]/g, '')
  if (req.isAuthenticated()) {
    owner = req.user.id
  } else if (!config.allowAnonymous) {
    return errorForbidden(req, res)
  }
  createNoteWithRevision({
    ownerId: owner,
    alias: req.alias ? req.alias : null,
    content: body
  }).then(function (note) {
    if (req.isAuthenticated()) {
      updateHistory(owner, note, body)
    }

    return res.redirect(config.serverURL + '/' + Note.encodeNoteId(note.id))
  }).catch(function (err) {
    logger.error(err)
    return errorInternalError(req, res)
  })
}

export function newCheckViewPermission(note: Note, isLogin: boolean, userId: string): boolean {
  if (note.permission === 'private') {
    return note.ownerId === userId
  }
  if (note.permission === 'limited' || note.permission === 'protected') {
    return isLogin
  }
  return true
}

export function checkViewPermission(req: Request, note: Note): boolean {
  if (note.permission === 'private') {
    return !(!req.isAuthenticated() || note.ownerId !== req.user.id);
  }
  if (note.permission === 'limited' || note.permission === 'protected') {
    return req.isAuthenticated();
  }
  return true
}

function findNote(req, res, callback: (note: Note) => void, include?: Includeable[] | null) {
  const noteId = req.params.noteId
  const id = req.params.noteId || req.params.shortid
  Note.parseNoteId(id, function (err, _id) {
    if (err) {
      logger.error(err)
      return errorInternalError(req, res)
    }
    Note.findOne({
      where: {
        id: _id
      },
      include: include || null
    }).then(function (note) {
      if (!note) {
        if (config.allowFreeURL && noteId && !config.forbiddenNoteIDs.includes(noteId)) {
          req.alias = noteId
          return newNote(req, res)
        } else {
          return errorNotFound(req, res)
        }
      }
      if (!checkViewPermission(req, note)) {
        return errorForbidden(req, res)
      } else {
        return callback(note)
      }
    }).catch(function (err) {
      logger.error(err)
      return errorInternalError(req, res)
    })
  })
}

function actionDownload(req, res, note) {
  const body = note.content
  let filename = Note.decodeTitle(note.title)
  filename = encodeURIComponent(filename)
  res.set({
    'Access-Control-Allow-Origin': '*', // allow CORS as API
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
    'Content-Type': 'text/markdown; charset=UTF-8',
    'Cache-Control': 'private',
    'Content-disposition': 'attachment; filename=' + filename + '.md',
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.send(body)
}

interface PublishActionParams {
  action: 'download' | 'edit'
}

export function publishNoteActions(req: Request<PublishActionParams>, res: Response): void {
  findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'download':
        actionDownload(req, res, note)
        break
      case 'edit':
        res.redirect(config.serverURL + '/' + (note.alias ? note.alias : Note.encodeNoteId(note.id)))
        break
      default:
        res.redirect(config.serverURL + '/s/' + note.shortid)
        break
    }
  })
}

export function publishSlideActions(req: Request<PublishActionParams>, res: Response): void {
  findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'edit':
        res.redirect(config.serverURL + '/' + (note.alias ? note.alias : Note.encodeNoteId(note.id)))
        break
      default:
        res.redirect(config.serverURL + '/p/' + note.shortid)
        break
    }
  })
}

interface GithubActionParams extends Record<string, string> {
  action: 'gist'
  noteId: string
}

export function githubActions(req: Request<GithubActionParams>, res: Response): void {
  const noteId = req.params.noteId
  findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'gist':
        githubActionGist(req, res, note)
        break
      default:
        res.redirect(config.serverURL + '/' + noteId)
        break
    }
  })
}

function githubActionGist(req: Request, res: Response, note: Note) {
  const code = req.query.code
  const state = req.query.state
  if (!code || !state) {
    return errorForbidden(req, res)
  } else {
    const data = {
      client_id: config.github.clientID,
      client_secret: config.github.clientSecret,
      code: code,
      state: state
    }
    const authUrl = 'https://github.com/login/oauth/access_token'
    request({
      url: authUrl,
      method: 'POST',
      json: data
    }, function (error, httpResponse, body) {
      if (!error && httpResponse.statusCode === 200) {
        const accessToken = body.access_token
        if (accessToken) {
          const content = note.content
          const title = Note.decodeTitle(note.title)
          const filename = title.replace('/', ' ') + '.md'
          const gist = {
            files: {}
          }
          gist.files[filename] = {
            content: content
          }
          const gistUrl = 'https://api.github.com/gists';
          request({
            url: gistUrl,
            headers: {
              'User-Agent': 'CodiMD',
              Authorization: 'token ' + accessToken
            },
            method: 'POST',
            json: gist
          }, function (error, httpResponse, body) {
            if (!error && httpResponse.statusCode === 201) {
              res.setHeader('referer', '')
              res.redirect(body.html_url)
            } else {
              return errorForbidden(req, res)
            }
          })
        } else {
          return errorForbidden(req, res)
        }
      } else {
        return errorForbidden(req, res)
      }
    })
  }
}

interface GitLabParams extends Record<string, string>{
  noteId: string
  action: 'projects'
}

export function gitlabActions(req: Request<GitLabParams>, res: Response): void {
  const noteId = req.params.noteId
  findNote(req, res, function () {
    const action = req.params.action
    switch (action) {
      case 'projects':
        gitlabActionProjects(req, res)
        break
      default:
        res.redirect(config.serverURL + '/' + noteId)
        break
    }
  })
}

interface GitLabActionResponse {
  baseURL: string
  version: string
  accesstoken: string
  profileid: string
  projects?: Record<string, string>
}

function gitlabActionProjects(req: Request, res: Response) {
  if (req.isAuthenticated()) {
    User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) {
        return errorNotFound(req, res)
      }
      const ret: Partial<GitLabActionResponse> = {baseURL: config.gitlab.baseURL, version: config.gitlab.version}
      ret.accesstoken = user.accessToken
      ret.profileid = user.profileid
      request(
        config.gitlab.baseURL + '/api/' + config.gitlab.version + '/projects?membership=yes&per_page=100&access_token=' + user.accessToken,
        function (error, httpResponse, body) {
          if (!error && httpResponse.statusCode === 200) {
            ret.projects = JSON.parse(body)
            return res.send(ret)
          } else {
            return res.send(ret)
          }
        }
      )
    }).catch(function (err) {
      logger.error('gitlab action projects failed: ' + err)
      return errorInternalError(req, res)
    })
  } else {
    return errorForbidden(req, res)
  }
}

export function showPublishSlide(req: Request, res: Response): void {
  const include = [{
    model: User,
    as: 'owner'
  }, {
    model: User,
    as: 'lastchangeuser'
  }]
  findNote(req, res, function (note) {
    // force to use short id
    const shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
      return res.redirect(config.serverURL + '/p/' + (note.alias || note.shortid))
    }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return errorNotFound(req, res)
      }
      const body = note.content
      const extracted = Note.extractMeta(body)
      const markdown = extracted.markdown
      const meta = Note.parseMeta(extracted.meta)
      const createtime = note.createdAt
      const updatetime = note.lastchangeAt
      let title = Note.decodeTitle(note.title)
      title = Note.generateWebTitle(meta.title || title)
      const data = {
        title: title,
        description: meta.description || (markdown ? Note.generateDescription(markdown) : null),
        viewcount: note.viewcount,
        createtime: createtime,
        updatetime: updatetime,
        body: markdown,
        theme: meta.slideOptions && utils.isRevealTheme(meta.slideOptions.theme),
        meta: JSON.stringify(extracted.meta),
        owner: note.owner ? note.owner.id : null,
        ownerprofile: note.owner ? User.getProfile(note.owner) : null,
        lastchangeuser: note.lastchangeuser ? note.lastchangeuser.id : null,
        lastchangeuserprofile: note.lastchangeuser ? User.getProfile(note.lastchangeuser) : null,
        robots: meta.robots || false, // default allow robots
        GA: meta.GA,
        disqus: meta.disqus,
        cspNonce: res.locals.nonce
      }
      res.set({
        'Cache-Control': 'private' // only cache by client
      })
      res.render('slide.ejs', data)
    }).catch(function (err) {
      logger.error(err)
      return errorInternalError(req, res)
    })
  }, include)
}
