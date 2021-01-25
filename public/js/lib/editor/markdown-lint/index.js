/* global CodeMirror */

// load CM lint plugin explicitly
import '@hackmd/codemirror/addon/lint/lint'

import '@hackmd/codemirror/addon/hint/show-hint.css'
import helpers from 'markdownlint-rule-helpers'

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
        messageHTML: `${ruleNames.slice(0, 1)}: ${ruleDescription}`,
        severity: 'error',
        from: CodeMirror.Pos(lineNumber, start),
        to: CodeMirror.Pos(lineNumber, end),
        __ruleNames: ruleNames,
        __ruleDescription: ruleDescription,
        __error: error,
        __lineNumber: lineNumber
      }
    })
  }

  CodeMirror.registerHelper('lint', 'markdown', validator)
})

export const linterOptions = {
  fixedTooltip: true,
  contextmenu: annotations => {
    const singleFixMenus = annotations
      .filter(ann => ann.__error.fixInfo)
      .map(annotation => {
        const error = annotation.__error
        return {
          content: `Fix ${error.ruleDescription}`,
          onClick () {
            const doc = window.editor.doc
            const fixInfo = error.fixInfo
            const line = fixInfo.lineNumber - 1
            const lineContent = doc.getLine(line) || ''
            const fixedText = helpers.applyFix(lineContent, error.fixInfo, '\n')

            let from = { line, ch: 0 }
            let to = { line, ch: lineContent ? lineContent.length - 1 : 0 }

            if (typeof fixedText === 'string') {
              doc.replaceRange(fixedText, from, to)
            } else {
              if (fixInfo.lineNumber === 1) {
                if (document.lineCount > 1) {
                  const nextLine = doc.getLine(to.line + 1) || ''
                  to = {
                    line: nextLine,
                    ch: 0
                  }
                }
              } else {
                const previousLine = doc.getLine(from.line - 1) || ''
                from = {
                  line: previousLine,
                  ch: previousLine.length
                }
              }

              // !FIXME: certain range out of bound
              doc.replaceRange('', from, to)
            }
          }
        }
      })

    return singleFixMenus
  }
}

function lint (content) {
  const { content: errors } = window.markdownlint.sync({
    strings: {
      content
    },
    resultVersion: 3
  })
  return errors
}
