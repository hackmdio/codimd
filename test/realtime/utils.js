'use strict'

const sinon = require('sinon')

function makeMockSocket (headers, query) {
  const broadCastChannelCache = {}
  return {
    id: Math.round(Math.random() * 10000),
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

exports.makeMockSocket = makeMockSocket
exports.removeModuleFromRequireCache = removeModuleFromRequireCache
