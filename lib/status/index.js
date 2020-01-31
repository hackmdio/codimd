'use strict'

const realtime = require('../realtime/realtime')
const config = require('../config')

exports.getStatus = async (req, res) => {
  const data = await realtime.getStatus()

  res.set({
    'Cache-Control': 'private', // only cache by client
    'X-Robots-Tag': 'noindex, nofollow', // prevent crawling
    'Content-Type': 'application/json'
  })
  res.send(data)
}

exports.getConfig = (req, res) => {
  const data = {
    domain: config.domain,
    urlpath: config.urlPath,
    debug: config.debug,
    version: config.fullversion,
    plantumlServer: config.plantuml.server,
    DROPBOX_APP_KEY: config.dropbox.appKey,
    allowedUploadMimeTypes: config.allowedUploadMimeTypes,
    defaultUseHardbreak: config.defaultUseHardbreak,
    linkifyHeaderStyle: config.linkifyHeaderStyle,
    useCDN: config.useCDN
  }
  res.set({
    'Cache-Control': 'private', // only cache by client
    'X-Robots-Tag': 'noindex, nofollow', // prevent crawling
    'Content-Type': 'application/javascript'
  })
  res.render('../js/lib/common/constant.ejs', data)
}
