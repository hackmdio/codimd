/* global CodeMirror */

// load CM lint plugin explicitly
import '@hackmd/codemirror/addon/lint/lint'
import './lint.css'

window.markdownit = require('markdown-it')
// eslint-disable-next-line
require('script-loader!markdownlint');

(function (mod) {
  mod(CodeMirror)
})(function (CodeMirror) {
  function validator (text) {
    return lint(text).map(error => {
      const {
        ruleNames,
        ruleDescription,
        lineNumber: ln,
        errorRange
      } = error
      const lineNumber = ln - 1

      let start = 0; let end = -1
      if (errorRange) {
        [start, end] = errorRange.map(r => r - 1)
      }

      return {
        messageHTML: `${ruleNames.join('/')}: ${ruleDescription}`,
        severity: 'error',
        from: CodeMirror.Pos(lineNumber, start),
        to: CodeMirror.Pos(lineNumber, end)
      }
    })
  }

  CodeMirror.registerHelper('lint', 'markdown', validator)
})

function lint (content) {
  const { content: errors } = window.markdownlint.sync({
    strings: {
      content
    }
  })
  return errors
}
