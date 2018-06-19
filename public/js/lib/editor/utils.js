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

export function insertText (cm, text, cursorEnd = 0) {
  var cursor = cm.getCursor()
  cm.replaceSelection(text, cursor, cursor)
  cm.focus()
  cm.setCursor({line: cursor.line, ch: cursor.ch + cursorEnd})
}

export function insertHeader (cm) {
  let cursor = cm.getCursor()
  let startOfLine = {line: cursor.line, ch: 0}
  let startOfLineText = cm.getRange(startOfLine, {line: cursor.line, ch: 1})
  // See if it is already a header
  if (startOfLineText === '#') {
    cm.replaceRange('#', startOfLine, startOfLine)
  } else {
    cm.replaceRange('# ', startOfLine, startOfLine)
  }
  cm.focus()
}

export function insertOnStartOfLines (cm, symbol, cursorEnd) {
  let cursor = cm.getCursor()
  var ranges = cm.listSelections()

  for (let i = 0; i < ranges.length; i++) {
    var range = ranges[i]
    if (!range.empty()) {
      const from = range.from()
      const to = range.to()
      for (let j = from.line; j <= to.line; ++j) {
        cm.replaceRange(symbol, {line: j, ch: 0}, {line: j, ch: 0})
      }
    } else {
      cm.replaceRange(symbol, {line: cursor.line, ch: 0}, {line: cursor.line, ch: 0})
    }
  }
  cm.setCursor({line: cursor.line, ch: (cursorEnd)? cursorEnd : cursor.ch})
  cm.focus()
}
