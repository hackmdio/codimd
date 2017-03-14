'use strict'
// external modules
var randomcolor = require('randomcolor')

// core
module.exports = function (name) {
  var color = randomcolor({
    seed: name,
    luminosity: 'dark'
  })
  var letter = name.substring(0, 1).toUpperCase()

  var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
  svg += '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="96" width="96" version="1.1" viewBox="0 0 96 96">'
  svg += '<g>'
  svg += '<rect width="96" height="96" fill="' + color + '" />'
  svg += '<text font-size="64px" font-family="sans-serif" text-anchor="middle" fill="#ffffff">'
  svg += '<tspan x="48" y="72" stroke-width=".26458px" fill="#ffffff">' + letter + '</tspan>'
  svg += '</text>'
  svg += '</g>'
  svg += '</svg>'

  return 'data:image/svg+xml;base64,' + new Buffer(svg).toString('base64')
}
