'use strict'

const fs = require('fs')
const jwt = require('jsonwebtoken')
const puppeteer = require('puppeteer')
const shortId = require('shortid')
const querystring = require('querystring')
const moment = require('moment')
const { Pandoc } = require('@hackmd/pandoc.js')

const config = require('../config')
const logger = require('../logger')
const { Note, Revision, User } = require('../models')
const { errorInternalError, errorNotFound } = require('../response')

function actionPublish (req, res, note) {
  res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
}

function actionSlide (req, res, note) {
  res.redirect(config.serverURL + '/p/' + (note.alias || note.shortid))
}

function actionDownload (req, res, note) {
  const body = note.content
  const title = Note.decodeTitle(note.title)
  const filename = encodeURIComponent(title)
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
  const body = note.content
  const extracted = Note.extractMeta(body)
  const markdown = extracted.markdown
  const meta = Note.parseMeta(extracted.meta)
  const createtime = note.createdAt
  const updatetime = note.lastchangeAt
  const title = Note.decodeTitle(note.title)

  const data = {
    title: meta.title || title,
    description: meta.description || (markdown ? Note.generateDescription(markdown) : null),
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

async function printPDF (noteUrl, headers = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  await page.setExtraHTTPHeaders(headers)
  await page.goto(noteUrl, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({ format: 'A4' })

  await browser.close()
  return pdf
}

function actionPDF (req, res, note) {
  const noteId = req.params.noteId

  if (req.method === 'POST') {
    const token = jwt.sign({ userId: req.user.id.toString() }, config.codimdSignKey, { expiresIn: 5 * 60 })

    const noteURL = `${config.serverURL}/${noteId}/pdf`

    return printPDF(noteURL, {
      Authorization: `Bearer ${token}`
    }).then(pdf => {
      res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length })
      res.send(pdf)
    })
  } else {
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
      viewcount: note.viewcount,
      createtime: createTime,
      updatetime: updateTime,
      body: body,
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

    return res.render('pretty.ejs', data)
  }
}

const outputFormats = {
  asciidoc: 'text/plain',
  context: 'application/x-latex',
  epub: 'application/epub+zip',
  epub3: 'application/epub+zip',
  latex: 'application/x-latex',
  odt: 'application/vnd.oasis.opendocument.text',
  pdf: 'application/pdf',
  rst: 'text/plain',
  rtf: 'application/rtf',
  textile: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

async function actionPandoc (req, res, note) {
  var url = config.serverURL || 'http://' + req.get('host')
  var body = note.content
  var extracted = Note.extractMeta(body)
  var content = extracted.markdown
  var title = Note.decodeTitle(note.title)

  if (!fs.existsSync(config.tmpPath)) {
    fs.mkdirSync(config.tmpPath)
  }
  const pandoc = new Pandoc()

  var path = config.tmpPath + '/' + Date.now()
  content = content.replace(/\]\(\//g, '](' + url + '/')

  // TODO: check export type
  const { exportType } = req.query

  try {
    // TODO: timeout rejection

    await pandoc.convertToFile(content, 'markdown', exportType, path, [
      '--metadata', `title=${title}`
    ])

    var stream = fs.createReadStream(path)
    var filename = title
    // Be careful of special characters
    filename = encodeURIComponent(filename)
    // Ideally this should strip them
    res.setHeader('Content-disposition', `attachment; filename="${filename}.${exportType}"`)
    res.setHeader('Cache-Control', 'private')
    res.setHeader('Content-Type', `${outputFormats[exportType]}; charset=UTF-8`)
    res.setHeader('X-Robots-Tag', 'noindex, nofollow') // prevent crawling
    stream.pipe(res)
  } catch (err) {
    // TODO: handle error
    res.json({
      message: err.message
    })
  }
}

function actionGist (req, res, note) {
  const data = {
    client_id: config.github.clientID,
    redirect_uri: config.serverURL + '/auth/github/callback/' + Note.encodeNoteId(note.id) + '/gist',
    scope: 'gist',
    state: shortId.generate()
  }
  const query = querystring.stringify(data)
  res.redirect('https://github.com/login/oauth/authorize?' + query)
}

function actionRevision (req, res, note) {
  const actionId = req.params.actionId
  if (actionId) {
    const time = moment(parseInt(actionId))
    if (!time.isValid()) {
      return errorNotFound(req, res)
    }
    Revision.getPatchedNoteRevisionByTime(note, time, function (err, content) {
      if (err) {
        logger.error(err)
        return errorInternalError(req, res)
      }
      if (!content) {
        return errorNotFound(req, res)
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
    Revision.getNoteRevisions(note, function (err, data) {
      if (err) {
        logger.error(err)
        return errorInternalError(req, res)
      }
      const result = {
        revision: data
      }
      res.set({
        'Access-Control-Allow-Origin': '*', // allow CORS as API
        'Access-Control-Allow-Headers': 'Range',
        'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
        'Cache-Control': 'private', // only cache by client
        'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
      })
      res.send(result)
    })
  }
}

exports.actionPublish = actionPublish
exports.actionSlide = actionSlide
exports.actionDownload = actionDownload
exports.actionInfo = actionInfo
exports.actionPDF = actionPDF
exports.actionGist = actionGist
exports.actionPandoc = actionPandoc
exports.actionRevision = actionRevision
