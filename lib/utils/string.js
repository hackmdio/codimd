'use strict'

function stripTags (s) {
  return s.replace(RegExp('</?[^<>]*>', 'gi'), '')
}

exports.stripTags = stripTags
