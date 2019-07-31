'use strict'

const sinon = require('sinon')
const path = require('path')

function makeMockSocket (headers, query) {
  const broadCastChannelCache = {}
  return {
    id: Math.round(Math.random() * 10000),
    request: {
      user: {}
    },
    handshake: {
      headers: Object.assign({}, headers),
      query: Object.assign({}, query)
    },
    on: sinon.fake(),
    emit: sinon.fake(),
    broadCastChannelCache: {},
    broadcast: {
      to: (channel) => {
        if (!broadCastChannelCache[channel]) {
          broadCastChannelCache[channel] = {
            channel: channel,
            emit: sinon.fake()
          }
        }
        return broadCastChannelCache[channel]
      }
    },
    disconnect: sinon.fake(),
    rooms: []
  }
}

function removeModuleFromRequireCache (modulePath) {
  delete require.cache[require.resolve(modulePath)]
}
function removeLibModuleCache () {
  const libPath = path.resolve(path.join(__dirname, '../../lib'))
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(libPath)) {
      delete require.cache[require.resolve(key)]
    }
  })
}

exports.makeMockSocket = makeMockSocket
exports.removeModuleFromRequireCache = removeModuleFromRequireCache
exports.removeLibModuleCache = removeLibModuleCache
