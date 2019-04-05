/* eslint-env browser, jquery */
/* global serverurl, Reveal, RevealMarkdown */

require('../css/extra.css')
require('../css/site.css')

import { preventXSS } from './render'
import { md, updateLastChange, removeDOMEvents, finishView } from './extra'

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
      if (source.hasOwnProperty(key)) {
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

// options from yaml meta
const meta = JSON.parse($('#meta').text())
var options = meta.slideOptions || {}

if (options.hasOwnProperty('allottedTime') || options.hasOwnProperty('allottedMinutes')) {
  defaultOptions.dependencies.push({
    src: `${serverurl}/build/reveal.js/plugin/elapsed-time-bar/elapsed-time-bar.js`
  });
  if (options.hasOwnProperty('allottedMinutes')) {
    options.allottedTime = options.allottedMinutes * 60 * 1000;
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
// breaks
if (typeof meta.breaks === 'boolean' && !meta.breaks) {
  md.options.breaks = false
} else {
  md.options.breaks = true
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
    let title = document.title
    finishView(slides)
    document.title = title
    Reveal.layout()
  } else {
    const markdown = $(event.currentSlide)
    if (!markdown.attr('data-rendered')) {
      let title = document.title
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
