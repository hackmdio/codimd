'use strict'
// response
// external modules
var fs = require('fs')
var markdownpdf = require('markdown-pdf')
var LZString = require('lz-string')
var shortId = require('shortid')
var querystring = require('querystring')
var request = require('request')
var moment = require('moment')

// core
var config = require('./config')
var logger = require('./logger')
var models = require('./models')

// public
var response = {
  errorForbidden: function (res) {
    responseError(res, '403', 'Forbidden', 'oh no.')
  },
  errorNotFound: function (res) {
    responseError(res, '404', 'Not Found', 'oops.')
  },
  errorBadRequest: function (res) {
    responseError(res, '400', 'Bad Request', 'something not right.')
  },
  errorInternalError: function (res) {
    responseError(res, '500', 'Internal Error', 'wtf.')
  },
  errorServiceUnavailable: function (res) {
    res.status(503).send("I'm busy right now, try again later.")
  },
  newNote: newNote,
  showNote: showNote,
  showPublishNote: showPublishNote,
  showPublishSlide: showPublishSlide,
  showIndex: showIndex,
  noteActions: noteActions,
  publishNoteActions: publishNoteActions,
  publishSlideActions: publishSlideActions,
  githubActions: githubActions,
  gitlabActions: gitlabActions
}

function responseError (res, code, detail, msg) {
  res.status(code).render(config.errorpath, {
    url: config.serverurl,
    title: code + ' ' + detail + ' ' + msg,
    code: code,
    detail: detail,
    msg: msg,
    useCDN: config.usecdn
  })
}

function showIndex (req, res, next) {
  res.render(config.indexpath, {
    url: config.serverurl,
    useCDN: config.usecdn,
    allowAnonymous: config.allowanonymous,
    facebook: config.isFacebookEnable,
    twitter: config.isTwitterEnable,
    github: config.isGitHubEnable,
    gitlab: config.isGitLabEnable,
    dropbox: config.isDropboxEnable,
    google: config.isGoogleEnable,
    ldap: config.isLDAPEnable,
    email: config.isEmailEnable,
    allowemailregister: config.allowemailregister,
    signin: req.isAuthenticated(),
    infoMessage: req.flash('info'),
    errorMessage: req.flash('error')
  })
}

function responseHackMD (res, note) {
  var body = note.content
  var extracted = models.Note.extractMeta(body)
  var meta = models.Note.parseMeta(extracted.meta)
  var title = models.Note.decodeTitle(note.title)
  title = models.Note.generateWebTitle(meta.title || title)
  res.set({
    'Cache-Control': 'private', // only cache by client
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.render(config.hackmdpath, {
    url: config.serverurl,
    title: title,
    useCDN: config.usecdn,
    allowAnonymous: config.allowanonymous,
    facebook: config.isFacebookEnable,
    twitter: config.isTwitterEnable,
    github: config.isGitHubEnable,
    gitlab: config.isGitLabEnable,
    dropbox: config.isDropboxEnable,
    google: config.isGoogleEnable,
    ldap: config.isLDAPEnable,
    email: config.isEmailEnable,
    allowemailregister: config.allowemailregister
  })
}

function newNote (req, res, next) {
  var owner = null
  if (req.isAuthenticated()) {
    owner = req.user.id
  } else if (!config.allowanonymous) {
    return response.errorForbidden(res)
  }
  models.Note.create({
    ownerId: owner,
    alias: req.alias ? req.alias : null
  }).then(function (note) {
    return res.redirect(config.serverurl + '/' + LZString.compressToBase64(note.id))
  }).catch(function (err) {
    logger.error(err)
    return response.errorInternalError(res)
  })
}

function checkViewPermission (req, note) {
  if (note.permission === 'private') {
    if (!req.isAuthenticated() || note.ownerId !== req.user.id) { return false } else { return true }
  } else if (note.permission === 'limited' || note.permission === 'protected') {
    if (!req.isAuthenticated()) { return false } else { return true }
  } else {
    return true
  }
}

function findNote (req, res, callback, include) {
  var noteId = req.params.noteId
  var id = req.params.noteId || req.params.shortid
  models.Note.parseNoteId(id, function (err, _id) {
    if (err) {
      logger.log(err)
    }
    models.Note.findOne({
      where: {
        id: _id
      },
      include: include || null
    }).then(function (note) {
      if (!note) {
        if (config.allowfreeurl && noteId) {
          req.alias = noteId
          return newNote(req, res)
        } else {
          return response.errorNotFound(res)
        }
      }
      if (!checkViewPermission(req, note)) {
        return response.errorForbidden(res)
      } else {
        return callback(note)
      }
    }).catch(function (err) {
      logger.error(err)
      return response.errorInternalError(res)
    })
  })
}

function showNote (req, res, next) {
  findNote(req, res, function (note) {
    // force to use note id
    var noteId = req.params.noteId
    var id = LZString.compressToBase64(note.id)
    if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) { return res.redirect(config.serverurl + '/' + (note.alias || id)) }
    return responseHackMD(res, note)
  })
}

function showPublishNote (req, res, next) {
  var include = [{
    model: models.User,
    as: 'owner'
  }, {
    model: models.User,
    as: 'lastchangeuser'
  }]
  findNote(req, res, function (note) {
    // force to use short id
    var shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
      return res.redirect(config.serverurl + '/s/' + (note.alias || note.shortid))
    }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return response.errorNotFound(res)
      }
      var body = note.content
      var extracted = models.Note.extractMeta(body)
      var markdown = extracted.markdown
      var meta = models.Note.parseMeta(extracted.meta)
      var createtime = note.createdAt
      var updatetime = note.lastchangeAt
      var title = models.Note.decodeTitle(note.title)
      title = models.Note.generateWebTitle(meta.title || title)
      var origin = config.serverurl
      var data = {
        title: title,
        description: meta.description || (markdown ? models.Note.generateDescription(markdown) : null),
        viewcount: note.viewcount,
        createtime: createtime,
        updatetime: updatetime,
        url: origin,
        body: body,
        useCDN: config.usecdn,
        owner: note.owner ? note.owner.id : null,
        ownerprofile: note.owner ? models.User.getProfile(note.owner) : null,
        lastchangeuser: note.lastchangeuser ? note.lastchangeuser.id : null,
        lastchangeuserprofile: note.lastchangeuser ? models.User.getProfile(note.lastchangeuser) : null,
        robots: meta.robots || false, // default allow robots
        GA: meta.GA,
        disqus: meta.disqus
      }
      return renderPublish(data, res)
    }).catch(function (err) {
      logger.error(err)
      return response.errorInternalError(res)
    })
  }, include)
}

function renderPublish (data, res) {
  res.set({
    'Cache-Control': 'private' // only cache by client
  })
  res.render(config.prettypath, data)
}

function actionPublish (req, res, note) {
  res.redirect(config.serverurl + '/s/' + (note.alias || note.shortid))
}

function actionSlide (req, res, note) {
  res.redirect(config.serverurl + '/p/' + (note.alias || note.shortid))
}

function actionDownload (req, res, note) {
  var body = note.content
  var title = models.Note.decodeTitle(note.title)
  var filename = title
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

function actionInfo (req, res, note) {
  var body = note.content
  var extracted = models.Note.extractMeta(body)
  var markdown = extracted.markdown
  var meta = models.Note.parseMeta(extracted.meta)
  var createtime = note.createdAt
  var updatetime = note.lastchangeAt
  var title = models.Note.decodeTitle(note.title)
  var data = {
    title: meta.title || title,
    description: meta.description || (markdown ? models.Note.generateDescription(markdown) : null),
    viewcount: note.viewcount,
    createtime: createtime,
    updatetime: updatetime
  }
  res.set({
    'Access-Control-Allow-Origin': '*', // allow CORS as API
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
    'Cache-Control': 'private', // only cache by client
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.send(data)
}

function actionPDF (req, res, note) {
  var body = note.content
  var extracted = models.Note.extractMeta(body)
  var title = models.Note.decodeTitle(note.title)

  if (!fs.existsSync(config.tmppath)) {
    fs.mkdirSync(config.tmppath)
  }
  var path = config.tmppath + '/' + Date.now() + '.pdf'
  markdownpdf().from.string(extracted.markdown).to(path, function () {
    var stream = fs.createReadStream(path)
    var filename = title
    // Be careful of special characters
    filename = encodeURIComponent(filename)
    // Ideally this should strip them
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '.pdf"')
    res.setHeader('Cache-Control', 'private')
    res.setHeader('Content-Type', 'application/pdf; charset=UTF-8')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow') // prevent crawling
    stream.pipe(res)
    fs.unlink(path)
  })
}

function actionGist (req, res, note) {
  var data = {
    client_id: config.github.clientID,
    redirect_uri: config.serverurl + '/auth/github/callback/' + LZString.compressToBase64(note.id) + '/gist',
    scope: 'gist',
    state: shortId.generate()
  }
  var query = querystring.stringify(data)
  res.redirect('https://github.com/login/oauth/authorize?' + query)
}

function actionRevision (req, res, note) {
  var actionId = req.params.actionId
  if (actionId) {
    var time = moment(parseInt(actionId))
    if (time.isValid()) {
      models.Revision.getPatchedNoteRevisionByTime(note, time, function (err, content) {
        if (err) {
          logger.error(err)
          return response.errorInternalError(res)
        }
        if (!content) {
          return response.errorNotFound(res)
        }
        res.set({
          'Access-Control-Allow-Origin': '*', // allow CORS as API
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
          'Cache-Control': 'private', // only cache by client
          'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
        })
        res.send(content)
      })
    } else {
      return response.errorNotFound(res)
    }
  } else {
    models.Revision.getNoteRevisions(note, function (err, data) {
      if (err) {
        logger.error(err)
        return response.errorInternalError(res)
      }
      var out = {
        revision: data
      }
      res.set({
        'Access-Control-Allow-Origin': '*', // allow CORS as API
        'Access-Control-Allow-Headers': 'Range',
        'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
        'Cache-Control': 'private', // only cache by client
        'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
      })
      res.send(out)
    })
  }
}

function noteActions (req, res, next) {
  var noteId = req.params.noteId
  findNote(req, res, function (note) {
    var action = req.params.action
    switch (action) {
      case 'publish':
      case 'pretty': // pretty deprecated
        actionPublish(req, res, note)
        break
      case 'slide':
        actionSlide(req, res, note)
        break
      case 'download':
        actionDownload(req, res, note)
        break
      case 'info':
        actionInfo(req, res, note)
        break
      case 'pdf':
        actionPDF(req, res, note)
        break
      case 'gist':
        actionGist(req, res, note)
        break
      case 'revision':
        actionRevision(req, res, note)
        break
      default:
        return res.redirect(config.serverurl + '/' + noteId)
    }
  })
}

function publishNoteActions (req, res, next) {
  findNote(req, res, function (note) {
    var action = req.params.action
    switch (action) {
      case 'edit':
        res.redirect(config.serverurl + '/' + (note.alias ? note.alias : LZString.compressToBase64(note.id)))
        break
      default:
        res.redirect(config.serverurl + '/s/' + note.shortid)
        break
    }
  })
}

function publishSlideActions (req, res, next) {
  findNote(req, res, function (note) {
    var action = req.params.action
    switch (action) {
      case 'edit':
        res.redirect(config.serverurl + '/' + (note.alias ? note.alias : LZString.compressToBase64(note.id)))
        break
      default:
        res.redirect(config.serverurl + '/p/' + note.shortid)
        break
    }
  })
}

function githubActions (req, res, next) {
  var noteId = req.params.noteId
  findNote(req, res, function (note) {
    var action = req.params.action
    switch (action) {
      case 'gist':
        githubActionGist(req, res, note)
        break
      default:
        res.redirect(config.serverurl + '/' + noteId)
        break
    }
  })
}

function githubActionGist (req, res, note) {
  var code = req.query.code
  var state = req.query.state
  if (!code || !state) {
    return response.errorForbidden(res)
  } else {
    var data = {
      client_id: config.github.clientID,
      client_secret: config.github.clientSecret,
      code: code,
      state: state
    }
    var authUrl = 'https://github.com/login/oauth/access_token'
    request({
      url: authUrl,
      method: 'POST',
      json: data
    }, function (error, httpResponse, body) {
      if (!error && httpResponse.statusCode === 200) {
        var accessToken = body.access_token
        if (accessToken) {
          var content = note.content
          var title = models.Note.decodeTitle(note.title)
          var filename = title.replace('/', ' ') + '.md'
          var gist = {
            'files': {}
          }
          gist.files[filename] = {
            'content': content
          }
          var gistUrl = 'https://api.github.com/gists'
          request({
            url: gistUrl,
            headers: {
              'User-Agent': 'HackMD',
              'Authorization': 'token ' + accessToken
            },
            method: 'POST',
            json: gist
          }, function (error, httpResponse, body) {
            if (!error && httpResponse.statusCode === 201) {
              res.setHeader('referer', '')
              res.redirect(body.html_url)
            } else {
              return response.errorForbidden(res)
            }
          })
        } else {
          return response.errorForbidden(res)
        }
      } else {
        return response.errorForbidden(res)
      }
    })
  }
}

function gitlabActions (req, res, next) {
  var noteId = req.params.noteId
  findNote(req, res, function (note) {
    var action = req.params.action
    switch (action) {
      case 'projects':
        gitlabActionProjects(req, res, note)
        break
      default:
        res.redirect(config.serverurl + '/' + noteId)
        break
    }
  })
}

function gitlabActionProjects (req, res, note) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) { return response.errorNotFound(res) }
      var ret = { baseURL: config.gitlab.baseURL }
      ret.accesstoken = user.accessToken
      ret.profileid = user.profileid
      request(
                config.gitlab.baseURL + '/api/v3/projects?access_token=' + user.accessToken,
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
      return response.errorInternalError(res)
    })
  } else {
    return response.errorForbidden(res)
  }
}

function showPublishSlide (req, res, next) {
  var include = [{
    model: models.User,
    as: 'owner'
  }, {
    model: models.User,
    as: 'lastchangeuser'
  }]
  findNote(req, res, function (note) {
    // force to use short id
    var shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) { return res.redirect(config.serverurl + '/p/' + (note.alias || note.shortid)) }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return response.errorNotFound(res)
      }
      var body = note.content
      var extracted = models.Note.extractMeta(body)
      var markdown = extracted.markdown
      var meta = models.Note.parseMeta(extracted.meta)
      var createtime = note.createdAt
      var updatetime = note.lastchangeAt
      var title = models.Note.decodeTitle(note.title)
      title = models.Note.generateWebTitle(meta.title || title)
      var origin = config.serverurl
      var data = {
        title: title,
        description: meta.description || (markdown ? models.Note.generateDescription(markdown) : null),
        viewcount: note.viewcount,
        createtime: createtime,
        updatetime: updatetime,
        url: origin,
        body: markdown,
        meta: JSON.stringify(extracted.meta),
        useCDN: config.usecdn,
        owner: note.owner ? note.owner.id : null,
        ownerprofile: note.owner ? models.User.getProfile(note.owner) : null,
        lastchangeuser: note.lastchangeuser ? note.lastchangeuser.id : null,
        lastchangeuserprofile: note.lastchangeuser ? models.User.getProfile(note.lastchangeuser) : null,
        robots: meta.robots || false, // default allow robots
        GA: meta.GA,
        disqus: meta.disqus
      }
      return renderPublishSlide(data, res)
    }).catch(function (err) {
      logger.error(err)
      return response.errorInternalError(res)
    })
  }, include)
}

function renderPublishSlide (data, res) {
  res.set({
    'Cache-Control': 'private' // only cache by client
  })
  res.render(config.slidepath, data)
}

module.exports = response
