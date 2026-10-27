/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const { JSDOM } = require('jsdom')

const sanitizeSvg = require('../lib/imageRouter/sanitizeSvg')

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const { window } = new JSDOM('')

// parse the sanitized output as XML, the way browsers load an SVG image
function parseSvg (output) {
  assert(output.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n'))
  const doc = new window.DOMParser().parseFromString(output, 'image/svg+xml')
  assert.strictEqual(doc.getElementsByTagName('parsererror').length, 0)
  return doc.documentElement
}

describe('sanitizeSvg', function () {
  it('keeps regular SVG content', function () {
    const root = parseSvg(sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">' +
      '<defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs>' +
      '<rect width="20" height="20" fill="url(#g)"/>' +
      '<text x="2" y="15">Hi</text></svg>'
    ))

    assert.strictEqual(root.namespaceURI, SVG_NAMESPACE)
    assert.strictEqual(root.getAttribute('viewBox'), '0 0 20 20')
    assert.strictEqual(root.getElementsByTagName('linearGradient')[0].getAttribute('id'), 'g')
    assert.strictEqual(root.getElementsByTagName('rect')[0].getAttribute('fill'), 'url(#g)')
    assert.strictEqual(root.getElementsByTagName('text')[0].textContent, 'Hi')
  })

  it('removes scripts, event handlers and javascript: URLs', function () {
    const output = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)">' +
      '<script>alert(2)</script>' +
      '<rect width="5" height="5" onclick="alert(3)"/>' +
      '<a xlink:href="javascript:alert(4)"><text>x</text></a>' +
      '<foreignObject><iframe src="https://example.com"></iframe></foreignObject>' +
      '<set attributeName="onmouseover" to="alert(5)"/>' +
      '</svg>'
    )
    const root = parseSvg(output)

    assert.strictEqual(root.getElementsByTagName('rect')[0].getAttribute('width'), '5')
    assert.strictEqual(root.getElementsByTagName('text')[0].textContent, 'x')
    assert(!/script|onload|onclick|onmouseover|javascript:|foreignObject|iframe|<set/i.test(output))
  })

  it('does not expand DTD entities', function () {
    const output = sanitizeSvg(
      '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY e "expanded">]>' +
      '<svg xmlns="http://www.w3.org/2000/svg"><text>&e;</text></svg>'
    )
    parseSvg(output)

    assert(!output.includes('DOCTYPE'))
    assert(!output.includes('expanded'))
  })

  it('adds the SVG namespace when it is missing', function () {
    const root = parseSvg(sanitizeSvg('<svg width="4" height="4"><circle r="2"/></svg>'))

    assert.strictEqual(root.namespaceURI, SVG_NAMESPACE)
    assert.strictEqual(root.getAttribute('xmlns'), SVG_NAMESPACE)
    assert.strictEqual(root.getElementsByTagName('circle').length, 1)
  })

  it('produces well-formed XML from HTML entities', function () {
    const output = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><text>a&nbsp;b</text></svg>')
    const root = parseSvg(output)

    assert(!output.includes('&nbsp;'))
    assert.strictEqual(root.getElementsByTagName('text')[0].textContent, 'a b')
  })

  it('drops content after the root element', function () {
    const output = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg><img src="x" onerror="alert(1)">')
    const root = parseSvg(output)

    assert.strictEqual(root.childNodes.length, 1)
    assert(!/img|onerror/.test(output))
  })

  it('rejects documents that are not SVG', function () {
    assert.strictEqual(sanitizeSvg('<html><body><script>alert(1)</script></body></html>'), null)
    assert.strictEqual(sanitizeSvg('<math><mi>x</mi></math>'), null)
    assert.strictEqual(sanitizeSvg('just text'), null)
    assert.strictEqual(sanitizeSvg(''), null)
  })

  it('rejects more than one root element', function () {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"></svg><svg xmlns="http://www.w3.org/2000/svg"></svg>'

    assert.strictEqual(sanitizeSvg(input), null)
  })
})
