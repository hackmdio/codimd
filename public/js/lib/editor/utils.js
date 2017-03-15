const wrapSymbols = ['*', '_', '~', '^', '+', '=']
export function wrapTextWith (editor, cm, symbol) {
  if (!cm.getSelection()) {
    return CodeMirror.Pass
  } else {
    var ranges = cm.listSelections()
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i]
      if (!range.empty()) {
        const from = range.from()
        const to = range.to()

        if (symbol !== 'Backspace') {
          cm.replaceRange(symbol, to, to, '+input')
          cm.replaceRange(symbol, from, from, '+input')
          // workaround selection range not correct after add symbol
          var _ranges = cm.listSelections()
          var anchorIndex = editor.indexFromPos(_ranges[i].anchor)
          var headIndex = editor.indexFromPos(_ranges[i].head)
          if (anchorIndex > headIndex) {
            _ranges[i].anchor.ch--
          } else {
            _ranges[i].head.ch--
          }
          cm.setSelections(_ranges)
        } else {
          var preEndPos = {
            line: to.line,
            ch: to.ch + 1
          }
          var preText = cm.getRange(to, preEndPos)
          var preIndex = wrapSymbols.indexOf(preText)
          var postEndPos = {
            line: from.line,
            ch: from.ch - 1
          }
          var postText = cm.getRange(postEndPos, from)
          var postIndex = wrapSymbols.indexOf(postText)
          // check if surround symbol are list in array and matched
          if (preIndex > -1 && postIndex > -1 && preIndex === postIndex) {
            cm.replaceRange('', to, preEndPos, '+delete')
            cm.replaceRange('', postEndPos, from, '+delete')
          }
        }
      }
    }
  }
}
