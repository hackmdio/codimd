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
        messageHTML: `${ruleNames.join('/')}: ${ruleDescription} <small>markdownlint(${ruleNames[0]})</small>`,
        severity: 'error',
        from: CodeMirror.Pos(lineNumber, start),
        to: CodeMirror.Pos(lineNumber, end),
        __error: error
      }
    })
  }

  CodeMirror.registerHelper('lint', 'markdown', validator)
})

export const linterOptions = {
  fixedTooltip: true,
  contextmenu: annotations => {
    const singleFixMenus = annotations
      .map(annotation => {
        const error = annotation.__error
        const ruleNameAlias = error.ruleNames.join('/')

        if (annotation.__error.fixInfo) {
          return {
            content: `Click to fix this violoation of ${ruleNameAlias}`,
            onClick () {
              const doc = window.editor.doc
              const fixInfo = normalizeFixInfo(error.fixInfo, error.lineNumber)
              const line = fixInfo.lineNumber - 1
              const lineContent = doc.getLine(line) || ''
              const fixedText = helpers.applyFix(lineContent, fixInfo, '\n')

              let from = { line, ch: 0 }
              let to = { line, ch: lineContent ? lineContent.length : 0 }

              if (typeof fixedText === 'string') {
                doc.replaceRange(fixedText, from, to)
              } else {
                if (fixInfo.lineNumber === 1) {
                  if (doc.lineCount() > 1) {
                    const nextLineStart = doc.indexFromPos({
                      line: to.line + 1,
                      ch: 0
                    })
                    to = doc.posFromIndex(nextLineStart)
                  }
                } else {
                  const previousLineEnd = doc.indexFromPos(from) - 1
                  from = doc.posFromIndex(previousLineEnd)
                }

                doc.replaceRange('', from, to)
              }
            }
          }
        } else {
          return {
            content: `Click for more information about ${ruleNameAlias}`,
            onClick () {
              window.open(error.ruleInformation, '_blank')
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

// Taken from https://github.com/DavidAnson/markdownlint/blob/2a9274ece586514ba3e2819cec3eb74312dc1b84/helpers/helpers.js#L611
/**
 * Normalizes the fields of a RuleOnErrorFixInfo instance.
 *
 * @param {Object} fixInfo RuleOnErrorFixInfo instance.
 * @param {number} [lineNumber] Line number.
 * @returns {Object} Normalized RuleOnErrorFixInfo instance.
 */
function normalizeFixInfo (fixInfo, lineNumber) {
  return {
    lineNumber: fixInfo.lineNumber || lineNumber,
    editColumn: fixInfo.editColumn || 1,
    deleteCount: fixInfo.deleteCount || 0,
    insertText: fixInfo.insertText || ''
  }
}
