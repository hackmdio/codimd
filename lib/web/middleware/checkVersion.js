'use strict'

const { promisify } = require('util')

const request = require('request')

const logger = require('../../logger')
const config = require('../../config')

let lastCheckAt
let latest = true
let versionItem = null

const VERSION_CHECK_ENDPOINT = 'https://evangelion.codimd.dev/'
const CHECK_TIMEOUT = 1000 * 60 * 60 * 24 // 1 day

const rp = promisify(request)

exports.versionCheckMiddleware = async function (req, res, next) {
  if (lastCheckAt && (lastCheckAt + CHECK_TIMEOUT > Date.now())) {
    return next()
  }

  // update lastCheckAt whether the check would fail or not
  lastCheckAt = Date.now()

  try {
    const { statusCode, body: data } = await rp({
      url: `${VERSION_CHECK_ENDPOINT}?v=${config.version}`,
      method: 'GET',
      json: true
    })

    if (statusCode !== 200 || data.status === 'error') {
      logger.error('Version check failed.')
      return next()
    }

    latest = data.latest
    versionItem = latest ? null : data.versionItem

    return next()
  } catch (err) {
    // ignore and skip version check
    logger.error('Version check failed.')
    logger.error(err)
    return next()
  }
}

exports.versionItem = versionItem
exports.outdated = outdated
