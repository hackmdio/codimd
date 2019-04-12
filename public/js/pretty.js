/* eslint-env browser, jquery */
/* global refreshView */

import {
  autoLinkify,
  deduplicatedHeaderId,
  removeDOMEvents,
  finishView,
  generateToc,
  md,
  parseMeta,
  postProcess,
  renderTOC,
  scrollToHash,
  smoothHashScroll,
  updateLastChange
} from './extra'

import { preventXSS } from './render'

require('../css/extra.css')
require('../css/slide-preview.css')
require('../css/site.css')

require('highlight.js/styles/github-gist.css')

const markdown = $('#doc.markdown-body')
const text = markdown.text()
const lastMeta = md.meta
md.meta = {}
delete md.metaError
let rendered = md.render(text)
if (md.meta.type && md.meta.type === 'slide') {
  const slideOptions = {
    separator: '^(\r\n?|\n)---(\r\n?|\n)$',
    verticalSeparator: '^(\r\n?|\n)----(\r\n?|\n)$'
  }
  const slides = window.RevealMarkdown.slidify(text, slideOptions)
  markdown.html(slides)
  window.RevealMarkdown.initialize()
  // prevent XSS
  markdown.html(preventXSS(markdown.html()))
  markdown.addClass('slides')
} else {
  if (lastMeta.type && lastMeta.type === 'slide') {
    refreshView()
    markdown.removeClass('slides')
  }
  // only render again when meta changed
  if (JSON.stringify(md.meta) !== JSON.stringify(lastMeta)) {
    parseMeta(md, null, markdown, $('#ui-toc'), $('#ui-toc-affix'))
    rendered = md.render(text)
  }
  // prevent XSS
  rendered = preventXSS(rendered)
  const result = postProcess(rendered)
  markdown.html(result.html())
}
$(document.body).show()

removeDOMEvents(markdown)
finishView(markdown)
autoLinkify(markdown)
deduplicatedHeaderId(markdown)
renderTOC(markdown)
generateToc('ui-toc')
generateToc('ui-toc-affix')
smoothHashScroll()
window.createtime = window.lastchangeui.time.attr('data-createtime')
window.lastchangetime = window.lastchangeui.time.attr('data-updatetime')
updateLastChange()

const url = window.location.pathname
$('.ui-edit').attr('href', `${url}/edit`)
const toc = $('.ui-toc')
const tocAffix = $('.ui-affix-toc')
const tocDropdown = $('.ui-toc-dropdown')
// toc
tocDropdown.click(e => {
  e.stopPropagation()
})

let enoughForAffixToc = true

function generateScrollspy () {
  $(document.body).scrollspy({
    target: ''
  })
  $(document.body).scrollspy('refresh')
  if (enoughForAffixToc) {
    toc.hide()
    tocAffix.show()
  } else {
    tocAffix.hide()
    toc.show()
  }
  $(document.body).scroll()
}

function windowResize () {
  // toc right
  const paddingRight = parseFloat(markdown.css('padding-right'))
  const right = ($(window).width() - (markdown.offset().left + markdown.outerWidth() - paddingRight))
  toc.css('right', `${right}px`)
  // affix toc left
  let newbool
  const rightMargin = (markdown.parent().outerWidth() - markdown.outerWidth()) / 2
  // for ipad or wider device
  if (rightMargin >= 133) {
    newbool = true
    const affixLeftMargin = (tocAffix.outerWidth() - tocAffix.width()) / 2
    const left = markdown.offset().left + markdown.outerWidth() - affixLeftMargin
    tocAffix.css('left', `${left}px`)
  } else {
    newbool = false
  }
  if (newbool !== enoughForAffixToc) {
    enoughForAffixToc = newbool
    generateScrollspy()
  }
}
$(window).resize(() => {
  windowResize()
})
$(document).ready(() => {
  windowResize()
  generateScrollspy()
  setTimeout(scrollToHash, 0)
  // tooltip
  $('[data-toggle="tooltip"]').tooltip()
})

export function scrollToTop () {
  $('body, html').stop(true, true).animate({
    scrollTop: 0
  }, 100, 'linear')
}

export function scrollToBottom () {
  $('body, html').stop(true, true).animate({
    scrollTop: $(document.body)[0].scrollHeight
  }, 100, 'linear')
}

window.scrollToTop = scrollToTop
window.scrollToBottom = scrollToBottom
