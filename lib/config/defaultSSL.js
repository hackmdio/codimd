'use strict'

const fs = require('fs')

function getFile (path) {
  if (fs.existsSync(path)) {
    return path
  }
  return undefined
}

module.exports = {
  sslkeypath: getFile('/run/secrets/key.pem'),
  sslcertpath: getFile('/run/secrets/cert.pem'),
  sslcapath: getFile('/run/secrets/ca.pem') !== undefined ? [getFile('/run/secrets/ca.pem')] : [],
  dhparampath: getFile('/run/secrets/dhparam.pem')
}
