/* eslint-env browser, jquery */
/* global _ */
// Inject line numbers for sync scroll.

import markdownitContainer from 'markdown-it-container'

import { md } from '../extra'
import modeType from './modeType'
import appState from './appState'

function addPart (tokens, idx) {
  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    tokens[idx].attrJoin('class', 'part')
    tokens[idx].attrJoin('data-startline', startline)
    tokens[idx].attrJoin('data-endline', endline)
  }
}

md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.bullet_list_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  if (tokens[idx].map) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    tokens[idx].attrJoin('data-startline', startline)
    tokens[idx].attrJoin('data-endline', endline)
  }
  return self.renderToken(...arguments)
}
md.renderer.rules.ordered_list_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
  let langName = ''
  let highlighted

  if (info) {
    langName = info.split(/\s+/g)[0]
    if (/!$/.test(info)) token.attrJoin('class', 'wrap')
    token.attrJoin('class', options.langPrefix + langName.replace(/=$|=\d+$|=\+$|!$|=!/, ''))
    token.attrJoin('class', 'hljs')
    token.attrJoin('class', 'raw')
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, info) || md.utils.escapeHtml(token.content)
  } else {
    highlighted = md.utils.escapeHtml(token.content)
  }

  if (highlighted.indexOf('<pre') === 0) {
    return `${highlighted}\n`
  }

  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
  }

  return `<pre><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
}
md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
  }
  return `<pre><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
}
function renderContainer (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('role', 'alert')
  tokens[idx].attrJoin('class', 'alert')
  tokens[idx].attrJoin('class', `alert-${tokens[idx].info.trim()}`)
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}

md.use(markdownitContainer, 'success', { render: renderContainer })
md.use(markdownitContainer, 'info', { render: renderContainer })
md.use(markdownitContainer, 'warning', { render: renderContainer })
md.use(markdownitContainer, 'danger', { render: renderContainer })
md.use(markdownitContainer, 'spoiler', {
  validate: function (params) {
    return params.trim().match(/^spoiler(\s+.*)?$/)
  },
  render: function (tokens, idx) {
    const m = tokens[idx].info.trim().match(/^spoiler(\s+.*)?$/)

    if (tokens[idx].nesting === 1) {
      // opening tag
      const startline = tokens[idx].map[0] + 1
      const endline = tokens[idx].map[1]

      const partClass = `class="part raw" data-startline="${startline}" data-endline="${endline}"`
      const summary = m[1] && m[1].trim()
      if (summary) {
        return `<details ${partClass}><summary>${md.renderInline(summary)}</summary>\n`
      } else {
        return `<details ${partClass}>\n`
      }
    } else {
      // closing tag
      return '</details>\n'
    }
  }
})

window.preventSyncScrollToEdit = false
window.preventSyncScrollToView = false

const editScrollThrottle = 5
const viewScrollThrottle = 5
const buildMapThrottle = 100

let viewScrolling = false
let editScrolling = false

let editArea = null
let viewArea = null
let markdownArea = null

let editor

export function setupSyncAreas (edit, view, markdown, _editor) {
  editArea = edit
  viewArea = view
  markdownArea = markdown

  editor = _editor

  editArea.on('scroll', _.throttle(syncScrollToView, editScrollThrottle))
  viewArea.on('scroll', _.throttle(syncScrollToEdit, viewScrollThrottle))
}

let scrollMap, lineHeightMap, viewTop, viewBottom

export function clearMap () {
  scrollMap = null
  lineHeightMap = null
  viewTop = null
  viewBottom = null
}
window.viewAjaxCallback = clearMap

const buildMap = _.throttle(buildMapInner, buildMapThrottle)

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildMapInner (callback) {
  if (!viewArea || !markdownArea) return
  let i, pos, a, b, acc

  const offset = viewArea.scrollTop() - viewArea.offset().top
  const _scrollMap = []
  const nonEmptyList = []
  const _lineHeightMap = []
  viewTop = 0
  viewBottom = viewArea[0].scrollHeight - viewArea.height()

  acc = 0
  const lines = editor.getValue().split('\n')
  const lineHeight = editor.defaultTextHeight()
  for (i = 0; i < lines.length; i++) {
    const str = lines[i]

    _lineHeightMap.push(acc)

    if (str.length === 0) {
      acc++
      continue
    }

    const h = editor.heightAtLine(i + 1) - editor.heightAtLine(i)
    acc += Math.round(h / lineHeight)
  }
  _lineHeightMap.push(acc)
  const linesCount = acc

  for (i = 0; i < linesCount; i++) {
    _scrollMap.push(-1)
  }

  nonEmptyList.push(0)
  // make the first line go top
  _scrollMap[0] = viewTop

  const parts = markdownArea.find('.part').toArray()
  for (i = 0; i < parts.length; i++) {
    const $el = $(parts[i])
    let t = $el.attr('data-startline') - 1
    if (t === '') {
      return
    }
    t = _lineHeightMap[t]
    if (t !== 0 && t !== nonEmptyList[nonEmptyList.length - 1]) {
      nonEmptyList.push(t)
    }
    _scrollMap[t] = Math.round($el.offset().top + offset - 10)
  }

  nonEmptyList.push(linesCount)
  _scrollMap[linesCount] = viewArea[0].scrollHeight

  pos = 0
  for (i = 1; i < linesCount; i++) {
    if (_scrollMap[i] !== -1) {
      pos++
      continue
    }

    a = nonEmptyList[pos]
    b = nonEmptyList[pos + 1]
    _scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a))
  }

  _scrollMap[0] = 0

  scrollMap = _scrollMap
  lineHeightMap = _lineHeightMap

  if (window.loaded && callback) callback()
}

// sync view scroll progress to edit
let viewScrollingTimer = null

export function syncScrollToEdit (event, preventAnimate) {
  if (appState.currentMode !== modeType.both || !appState.syncscroll || !editArea) return
  if (window.preventSyncScrollToEdit) {
    if (typeof window.preventSyncScrollToEdit === 'number') {
      window.preventSyncScrollToEdit--
    } else {
      window.preventSyncScrollToEdit = false
    }
    return
  }
  if (!scrollMap || !lineHeightMap) {
    buildMap(() => {
      syncScrollToEdit(event, preventAnimate)
    })
    return
  }
  if (editScrolling) return

  const scrollTop = viewArea[0].scrollTop
  let lineIndex = 0
  for (let i = 0, l = scrollMap.length; i < l; i++) {
    if (scrollMap[i] > scrollTop) {
      break
    } else {
      lineIndex = i
    }
  }
  let lineNo = 0
  let lineDiff = 0
  for (let i = 0, l = lineHeightMap.length; i < l; i++) {
    if (lineHeightMap[i] > lineIndex) {
      break
    } else {
      lineNo = lineHeightMap[i]
      lineDiff = lineHeightMap[i + 1] - lineNo
    }
  }

  let posTo = 0
  let topDiffPercent = 0
  let posToNextDiff = 0
  const scrollInfo = editor.getScrollInfo()
  const textHeight = editor.defaultTextHeight()
  const preLastLineHeight = scrollInfo.height - scrollInfo.clientHeight - textHeight
  const preLastLineNo = Math.round(preLastLineHeight / textHeight)
  const preLastLinePos = scrollMap[preLastLineNo]

  if (scrollInfo.height > scrollInfo.clientHeight && scrollTop >= preLastLinePos) {
    posTo = preLastLineHeight
    topDiffPercent = (scrollTop - preLastLinePos) / (viewBottom - preLastLinePos)
    posToNextDiff = textHeight * topDiffPercent
    posTo += Math.ceil(posToNextDiff)
  } else {
    posTo = lineNo * textHeight
    topDiffPercent = (scrollTop - scrollMap[lineNo]) / (scrollMap[lineNo + lineDiff] - scrollMap[lineNo])
    posToNextDiff = textHeight * lineDiff * topDiffPercent
    posTo += Math.ceil(posToNextDiff)
  }

  if (preventAnimate) {
    editArea.scrollTop(posTo)
  } else {
    const posDiff = Math.abs(scrollInfo.top - posTo)
    var duration = posDiff / 50
    duration = duration >= 100 ? duration : 100
    editArea.stop(true, true).animate({
      scrollTop: posTo
    }, duration, 'linear')
  }

  viewScrolling = true
  clearTimeout(viewScrollingTimer)
  viewScrollingTimer = setTimeout(viewScrollingTimeoutInner, duration * 1.5)
}

function viewScrollingTimeoutInner () {
  viewScrolling = false
}

// sync edit scroll progress to view
let editScrollingTimer = null

export function syncScrollToView (event, preventAnimate) {
  if (appState.currentMode !== modeType.both || !appState.syncscroll || !viewArea) return
  if (window.preventSyncScrollToView) {
    if (typeof preventSyncScrollToView === 'number') {
      window.preventSyncScrollToView--
    } else {
      window.preventSyncScrollToView = false
    }
    return
  }
  if (!scrollMap || !lineHeightMap) {
    buildMap(() => {
      syncScrollToView(event, preventAnimate)
    })
    return
  }
  if (viewScrolling) return

  let posTo
  let topDiffPercent, posToNextDiff
  const scrollInfo = editor.getScrollInfo()
  const textHeight = editor.defaultTextHeight()
  const lineNo = Math.floor(scrollInfo.top / textHeight)
  // if reach the last line, will start lerp to the bottom
  const diffToBottom = (scrollInfo.top + scrollInfo.clientHeight) - (scrollInfo.height - textHeight)
  if (scrollInfo.height > scrollInfo.clientHeight && diffToBottom > 0) {
    topDiffPercent = diffToBottom / textHeight
    posTo = scrollMap[lineNo + 1]
    posToNextDiff = (viewBottom - posTo) * topDiffPercent
    posTo += Math.floor(posToNextDiff)
  } else {
    topDiffPercent = (scrollInfo.top % textHeight) / textHeight
    posTo = scrollMap[lineNo]
    posToNextDiff = (scrollMap[lineNo + 1] - posTo) * topDiffPercent
    posTo += Math.floor(posToNextDiff)
  }

  if (preventAnimate) {
    viewArea.scrollTop(posTo)
  } else {
    const posDiff = Math.abs(viewArea.scrollTop() - posTo)
    var duration = posDiff / 50
    duration = duration >= 100 ? duration : 100
    viewArea.stop(true, true).animate({
      scrollTop: posTo
    }, duration, 'linear')
  }

  editScrolling = true
  clearTimeout(editScrollingTimer)
  editScrollingTimer = setTimeout(editScrollingTimeoutInner, duration * 1.5)
}

function editScrollingTimeoutInner () {
  editScrolling = false
}
