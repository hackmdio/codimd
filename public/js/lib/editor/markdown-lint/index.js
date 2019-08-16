import markdownlint from 'markdownlint'

// load lint plugin explicitly
import 'script-loader!@hackmd/codemirror/addon/lint/lint'
import './lint.css'

(function(mod) {
  mod(CodeMirror);
})(function(CodeMirror) {
  function validator(text, options) {
    return lint(text).map(error => {
      const lineNumber = error.lineNumber - 1

      let start, end
      if (error.errorRange) {
        start = error.errorRange[0] - 1
        end = error.errorRange[1] - 1
      } else {
        start = 0
        end = -1
      }

      return {
        message: error.ruleDescription,
        severity: 'error',
        from: CodeMirror.Pos(lineNumber, start),
        to: CodeMirror.Pos(lineNumber, end)
      }
    })
  }

  CodeMirror.registerHelper('lint', 'markdown', validator);
});

function lint (content) {
  const { content: errors } = markdownlint.sync({
    strings: {
      content
    }
  })
  return errors
}
