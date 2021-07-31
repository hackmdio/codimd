/* eslint-env browser, jquery */
// allow some attributes

import {filterXSS, escapeAttrValue, whiteList} from 'xss'

const whiteListAttr = ['id', 'class', 'style']
window.whiteListAttr = whiteListAttr
// allow link starts with '.', '/' and custom protocol with '://', exclude link starts with javascript://
const linkRegex = /^(?!javascript:\/\/)([\w|-]+:\/\/)|^([.|/])+/i
// allow data uri, from https://gist.github.com/bgrins/6194623
const dataUriRegex = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@/?%\s]*)\s*$/i
// custom white list
// allow ol specify start number
whiteList.ol = ['start']
// allow li specify value number
whiteList.li = ['value']
// allow style tag
whiteList.style = []
// allow kbd tag
whiteList.kbd = []
// allow ifram tag with some safe attributes
whiteList.iframe = ['allowfullscreen', 'name', 'referrerpolicy', 'src', 'width', 'height']
// allow summary tag
whiteList.summary = []
// allow ruby tag
whiteList.ruby = []
// allow rp tag for ruby
whiteList.rp = []
// allow rt tag for ruby
whiteList.rt = []
// allow figure tag
whiteList.figure = []
// allow figcaption tag
whiteList.figcaption = []

const filterXSSOptions = {
  allowCommentTag: true,
  whiteList: whiteList,
  escapeHtml: function (html) {
    // allow html comment in multiple lines
    return html.replace(/<(?!!--)/g, '&lt;').replace(/-->/g, '__HTML_COMMENT_END__').replace(/>/g, '&gt;').replace(/__HTML_COMMENT_END__/g, '-->')
  },
  onIgnoreTag: function (tag, html, options) {
    // allow comment tag
    if (tag === '!--') {
      // do not filter its attributes
      return html.replace(/<(?!!--)/g, '&lt;').replace(/-->/g, '__HTML_COMMENT_END__').replace(/>/g, '&gt;').replace(/__HTML_COMMENT_END__/g, '-->')
    }
  },
  onTagAttr: function (tag, name, value, isWhiteAttr) {
    // allow href and src that match linkRegex
    if (isWhiteAttr && (name === 'href' || name === 'src') && linkRegex.test(value)) {
      return name + '="' + escapeAttrValue(value) + '"'
    }
    // allow data uri in img src
    if (isWhiteAttr && (tag === 'img' && name === 'src') && dataUriRegex.test(value)) {
      return name + '="' + escapeAttrValue(value) + '"'
    }
  },
  onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
    // allow attr start with 'data-' or in the whiteListAttr
    if (name.substr(0, 5) === 'data-' || window.whiteListAttr.indexOf(name) !== -1) {
      // escape its value using built-in escapeAttrValue function
      return name + '="' + escapeAttrValue(value) + '"'
    }
  }
}

export function preventXSS (html) {
  return filterXSS(html, filterXSSOptions)
}
window.preventXSS = preventXSS

export {escapeAttrValue} from 'xss'
