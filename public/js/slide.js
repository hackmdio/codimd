/* eslint-env browser, jquery */
/* global serverurl, Reveal, RevealMarkdown */

import { preventXSS } from './render'
import { md, updateLastChange, removeDOMEvents, finishView } from './extra'

require('../css/extra.css')
require('../css/site.css')

const body = preventXSS($('.slides').text())

window.createtime = window.lastchangeui.time.attr('data-createtime')
window.lastchangetime = window.lastchangeui.time.attr('data-updatetime')
updateLastChange()
const url = window.location.pathname
$('.ui-edit').attr('href', `${url}/edit`)
$('.ui-print').attr('href', `${url}?print-pdf`)

$(document).ready(() => {
  // tooltip
  $('[data-toggle="tooltip"]').tooltip()
})

function extend () {
  const target = {}

  for (const source of arguments) {
    for (const key in source) {
      if (Object.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }

  return target
}

// Optional libraries used to extend on reveal.js
const deps = [{
  src: `${serverurl}/build/reveal.js/lib/js/classList.js`,
  condition () {
    return !document.body.classList
  }
}, {
  src: `${serverurl}/build/reveal.js/plugin/notes/notes.js`,
  async: true,
  condition () {
    return !!document.body.classList
  }
}]

// options from yaml meta
const meta = JSON.parse($('#meta').text())
// breaks
if (typeof meta.breaks === 'boolean') {
  md.options.breaks = meta.breaks
} else {
  md.options.breaks = window.defaultUseHardbreak
}

const slideOptions = {
  separator: '^(\r\n?|\n)---(\r\n?|\n)$',
  verticalSeparator: '^(\r\n?|\n)----(\r\n?|\n)$'
}
const slides = RevealMarkdown.slidify(body, slideOptions)
$('.slides').html(slides)
RevealMarkdown.initialize()
removeDOMEvents($('.slides'))
$('.slides').show()

// default options to init reveal.js
const defaultOptions = {
  controls: true,
  progress: true,
  slideNumber: true,
  history: true,
  center: true,
  transition: 'none',
  dependencies: deps
}

var options = meta.slideOptions || {}

if (Object.hasOwnProperty.call(options, 'spotlight')) {
  defaultOptions.dependencies.push({
    src: `${serverurl}/build/reveal.js/plugin/spotlight/spotlight.js`
  })
}

if (Object.hasOwnProperty.call(options, 'allottedTime') || Object.hasOwnProperty.call(options, 'allottedMinutes')) {
  defaultOptions.dependencies.push({
    src: `${serverurl}/build/reveal.js/plugin/elapsed-time-bar/elapsed-time-bar.js`
  })
  if (Object.hasOwnProperty.call(options, 'allottedMinutes')) {
    options.allottedTime = options.allottedMinutes * 60 * 1000
  }
}

const view = $('.reveal')

// text language
if (meta.lang && typeof meta.lang === 'string') {
  view.attr('lang', meta.lang)
} else {
  view.removeAttr('lang')
}
// text direction
if (meta.dir && typeof meta.dir === 'string' && meta.dir === 'rtl') {
  options.rtl = true
} else {
  options.rtl = false
}

// options from URL query string
const queryOptions = Reveal.getQueryHash() || {}

options = extend(defaultOptions, options, queryOptions)
Reveal.initialize(options)

window.viewAjaxCallback = () => {
  Reveal.layout()
}

function renderSlide (event) {
  if (window.location.search.match(/print-pdf/gi)) {
    const slides = $('.slides')
    const title = document.title
    finishView(slides)
    document.title = title
    Reveal.layout()
  } else {
    const markdown = $(event.currentSlide)
    if (!markdown.attr('data-rendered')) {
      const title = document.title
      finishView(markdown)
      markdown.attr('data-rendered', 'true')
      document.title = title
      Reveal.layout()
    }
  }
}

Reveal.addEventListener('ready', event => {
  renderSlide(event)
  const markdown = $(event.currentSlide)
  // force browser redraw
  setTimeout(() => {
    markdown.hide().show(0)
  }, 0)
})
Reveal.addEventListener('slidechanged', renderSlide)

const isWinLike = navigator.platform.indexOf('Win') > -1

if (isWinLike) $('.container').addClass('hidescrollbar')
