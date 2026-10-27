'use strict'

const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const { window } = new JSDOM('')
const DOMPurify = createDOMPurify(window)
const serializer = new window.XMLSerializer()

/**
 * Sanitize an uploaded SVG image so it can be served from the CodiMD origin.
 *
 * DOMPurify (SVG profile) strips scripts, event handlers, javascript: URLs,
 * <foreignObject> and everything else that is not plain SVG. The input is
 * parsed as HTML, so DTDs and XML entities are never expanded. The result is
 * re-serialized as standalone XML, which also adds the SVG namespace that
 * browsers require to render the file through <img>.
 *
 * @param {string} input raw SVG source
 * @returns {string|null} sanitized SVG document, or null if the input does not
 *   consist of a single <svg> root element
 */
function sanitizeSvg (input) {
  const fragment = DOMPurify.sanitize(String(input), {
    USE_PROFILES: { svg: true, svgFilters: true },
    RETURN_DOM_FRAGMENT: true
  })

  const roots = fragment.children
  if (roots.length !== 1) return null

  const root = roots[0]
  if (root.namespaceURI !== SVG_NAMESPACE || root.localName !== 'svg') return null

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(root) + '\n'
}

module.exports = sanitizeSvg
