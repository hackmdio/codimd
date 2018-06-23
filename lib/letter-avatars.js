'use strict'
// external modules
const md5 = require('blueimp-md5')
const randomcolor = require('randomcolor')
const config = require('./config')

// core
exports.generateAvatar = function (name) {
  const color = randomcolor({
    seed: name,
    luminosity: 'dark'
  })
  const letter = name.substring(0, 1).toUpperCase()

  let svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
  svg += '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="96" width="96" version="1.1" viewBox="0 0 96 96">'
  svg += '<g>'
  svg += '<rect width="96" height="96" fill="' + color + '" />'
  svg += '<text font-size="64px" font-family="sans-serif" text-anchor="middle" fill="#ffffff">'
  svg += '<tspan x="48" y="72" stroke-width=".26458px" fill="#ffffff">' + letter + '</tspan>'
  svg += '</text>'
  svg += '</g>'
  svg += '</svg>'

  return svg
}

exports.generateAvatarURL = function (name, email = '', big = true) {
  let photo
  if (email !== '' && config.allowGravatar) {
    photo = 'https://www.gravatar.com/avatar/' + md5(email.toLowerCase())
    if (big) {
      photo += '?s=400'
    } else {
      photo += '?s=96'
    }
  } else {
    photo = config.serverURL + '/user/' + (name || email.substring(0, email.lastIndexOf('@')) || md5(email.toLowerCase())) + '/avatar.svg'
  }
  return photo
}
