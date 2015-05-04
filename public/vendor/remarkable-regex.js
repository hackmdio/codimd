/*!
 * remarkable-regexp
 * Copyright (c) 2014 Alex Kocharin
 * MIT Licensed
 */

/**
 * Escape special characters in the given string of html.
 *
 * Borrowed from escape-html component, MIT-licensed
 */
var stuff = {};
stuff.escape = function(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Constructor function
 */

function Plugin(regexp, replacer) {
  // return value should be a callable function
  // with strictly defined options passed by remarkable
  var self = function(remarkable, options) {
    self.options = options
    self.init(remarkable)
  }

  // initialize plugin object
  self.__proto__ = Plugin.prototype

  // clone regexp with all the flags
  var flags = (regexp.global     ? 'g' : '')
            + (regexp.multiline  ? 'm' : '')
            + (regexp.ignoreCase ? 'i' : '')

  self.regexp = RegExp('^' + regexp.source, flags)

  // copy init options
  self.replacer = replacer

  // this plugin can be inserted multiple times,
  // so we're generating unique name for it
  self.id = 'regexp-' + JSON.stringify(Math.random()).slice(2)

  return self
}

// function that registers plugin with remarkable
Plugin.prototype.init = function(remarkable) {
  remarkable.inline.ruler.push(this.id, this.parse.bind(this))

  remarkable.renderer.rules[this.id] = this.render.bind(this)
}

Plugin.prototype.parse = function(state, silent) {
  // slowwww... maybe use an advanced regexp engine for this
  var match = this.regexp.exec(state.src.slice(state.pos))
  if (!match) return false

  // valid match found, now we need to advance cursor
  state.pos += match[0].length

  // don't insert any tokens in silent mode
  if (silent) return true

  state.push({
    type  : this.id,
    level : state.level,
    match : match,
  })

  return true
}

Plugin.prototype.render = function(tokens, id, options, env) {
  return this.replacer(tokens[id].match, stuff)
}