/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const mock = require('mock-require')

describe('Content security policies', function () {
  let defaultConfig, csp

  before(function () {
    csp = require('../lib/csp')
  })

  beforeEach(function () {
    // Reset config to make sure we don't influence other tests
    defaultConfig = {
      csp: {
        enable: true,
        directives: {
        },
        addDefaults: true,
        addDisqus: true,
        addGoogleAnalytics: true,
        upgradeInsecureRequests: 'auto',
        reportURI: undefined
      },
      useCDN: true
    }
  })

  afterEach(function () {
    mock.stop('../lib/config')
    csp = mock.reRequire('../lib/csp')
  })

  after(function () {
    mock.stopAll()
    csp = mock.reRequire('../lib/csp')
  })

  // beginnging Tests
  it('Disable CDN', function () {
    const testconfig = defaultConfig
    testconfig.useCDN = false
    mock('../lib/config', testconfig)
    csp = mock.reRequire('../lib/csp')

    assert(!csp.computeDirectives().scriptSrc.includes('https://cdnjs.cloudflare.com'))
    assert(!csp.computeDirectives().scriptSrc.includes('https://cdn.jsdelivr.net'))
    assert(!csp.computeDirectives().scriptSrc.includes('https://cdn.mathjax.org'))
    assert(!csp.computeDirectives().styleSrc.includes('https://cdnjs.cloudflare.com'))
    assert(!csp.computeDirectives().styleSrc.includes('https://cdn.jsdelivr.net'))
    assert(!csp.computeDirectives().styleSrc.includes('https://fonts.googleapis.com'))
    assert(!csp.computeDirectives().fontSrc.includes('https://cdnjs.cloudflare.com'))
    assert(!csp.computeDirectives().fontSrc.includes('https://fonts.gstatic.com'))
  })

  it('Disable Google Analytics', function () {
    const testconfig = defaultConfig
    testconfig.csp.addGoogleAnalytics = false
    mock('../lib/config', testconfig)
    csp = mock.reRequire('../lib/csp')

    assert(!csp.computeDirectives().scriptSrc.includes('https://www.google-analytics.com'))
  })

  it('Disable Disqus', function () {
    const testconfig = defaultConfig
    testconfig.csp.addDisqus = false
    mock('../lib/config', testconfig)
    csp = mock.reRequire('../lib/csp')

    assert(!csp.computeDirectives().scriptSrc.includes('https://disqus.com'))
    assert(!csp.computeDirectives().scriptSrc.includes('https://*.disqus.com'))
    assert(!csp.computeDirectives().scriptSrc.includes('https://*.disquscdn.com'))
    assert(!csp.computeDirectives().styleSrc.includes('https://*.disquscdn.com'))
    assert(!csp.computeDirectives().fontSrc.includes('https://*.disquscdn.com'))
  })

  it('Set ReportURI', function () {
    const testconfig = defaultConfig
    testconfig.csp.reportURI = 'https://example.com/reportURI'
    mock('../lib/config', testconfig)
    csp = mock.reRequire('../lib/csp')

    assert.strictEqual(csp.computeDirectives().reportUri, 'https://example.com/reportURI')
  })

  it('Set own directives', function () {
    const testconfig = defaultConfig
    mock('../lib/config', defaultConfig)
    csp = mock.reRequire('../lib/csp')
    const unextendedCSP = csp.computeDirectives()
    testconfig.csp.directives = {
      defaultSrc: ['https://default.example.com'],
      scriptSrc: ['https://script.example.com'],
      imgSrc: ['https://img.example.com'],
      styleSrc: ['https://style.example.com'],
      fontSrc: ['https://font.example.com'],
      objectSrc: ['https://object.example.com'],
      mediaSrc: ['https://media.example.com'],
      childSrc: ['https://child.example.com'],
      connectSrc: ['https://connect.example.com']
    }
    mock('../lib/config', testconfig)
    csp = mock.reRequire('../lib/csp')

    const variations = ['default', 'script', 'img', 'style', 'font', 'object', 'media', 'child', 'connect']

    for (let i = 0; i < variations.length; i++) {
      assert.strictEqual(csp.computeDirectives()[variations[i] + 'Src'].toString(), ['https://' + variations[i] + '.example.com'].concat(unextendedCSP[variations[i] + 'Src']).toString())
    }
  })

  /*
   * This test reminds us to update the CSP hash for the speaker notes
   */
  it('Unchanged hash for reveal.js speaker notes plugin', function () {
    const hash = crypto.createHash('sha1')
    hash.update(fs.readFileSync(path.resolve(__dirname, '../node_modules/reveal.js/plugin/notes/notes.html'), 'utf8'), 'utf8')
    assert.strictEqual(hash.digest('hex'), 'd5d872ae49b5db27f638b152e6e528837204d380')
  })
})
