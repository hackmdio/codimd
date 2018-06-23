const wrapSymbols = ['*', '_', '~', '^', '+', '=']
export function wrapTextWith (editor, cm, symbol) {
  if (!cm.getSelection()) {
    return CodeMirror.Pass
  } else {
    let ranges = cm.listSelections()
    for (let i = 0; i < ranges.length; i++) {
      let range = ranges[i]
      if (!range.empty()) {
        const from = range.from()
        const to = range.to()

        if (symbol !== 'Backspace') {
          let selection = cm.getRange(from, to)
          let anchorIndex = editor.indexFromPos(ranges[i].anchor)
          let headIndex = editor.indexFromPos(ranges[i].head)
          cm.replaceRange(symbol + selection + symbol, from, to, '+input')
          if (anchorIndex > headIndex) {
            ranges[i].anchor.ch+= symbol.length
            ranges[i].head.ch+= symbol.length
          } else {
            ranges[i].head.ch+= symbol.length
            ranges[i].anchor.ch+= symbol.length
          }
          cm.setSelections(ranges)
        } else {
          let preEndPos = {
            line: to.line,
            ch: to.ch + symbol.length
          }
          let preText = cm.getRange(to, preEndPos)
          let preIndex = wrapSymbols.indexOf(preText)
          let postEndPos = {
            line: from.line,
            ch: from.ch - symbol.length
          }
          let postText = cm.getRange(postEndPos, from)
          let postIndex = wrapSymbols.indexOf(postText)
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
  let cursor = cm.getCursor()
  cm.replaceSelection(text, cursor, cursor)
  cm.focus()
  cm.setCursor({line: cursor.line, ch: cursor.ch + cursorEnd})
}

export function insertLink(cm, isImage) {
  let cursor = cm.getCursor()
  let ranges = cm.listSelections()
  const linkEnd = '](https://)'
  const symbol = (isImage) ? '![' : '['

  for (let i = 0; i < ranges.length; i++) {
    let range = ranges[i]
    if (!range.empty()) {
      const from = range.from()
      const to = range.to()
      let anchorIndex = editor.indexFromPos(ranges[i].anchor)
      let headIndex = editor.indexFromPos(ranges[i].head)
      let selection = cm.getRange(from, to)
      selection = symbol + selection + linkEnd
      cm.replaceRange(selection, from, to)
      if (anchorIndex > headIndex) {
        ranges[i].anchor.ch+= symbol.length
        ranges[i].head.ch+= symbol.length
      } else {
        ranges[i].head.ch+= symbol.length
        ranges[i].anchor.ch+= symbol.length
      }
      cm.setSelections(ranges)
    } else {
      cm.replaceRange(symbol + linkEnd, cursor, cursor)
      cm.setCursor({line: cursor.line, ch: cursor.ch + symbol.length + linkend.length})
    }
  }
  cm.focus()
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

export function insertOnStartOfLines (cm, symbol) {
  let cursor = cm.getCursor()
  let ranges = cm.listSelections()

  for (let i = 0; i < ranges.length; i++) {
    let range = ranges[i]
    if (!range.empty()) {
      const from = range.from()
      const to = range.to()
      let selection = cm.getRange({line: from.line, ch: 0}, to)
      selection = selection.replace(/\n/g, '\n' + symbol)
      selection = symbol + selection
      cm.replaceRange(selection, from, to)
    } else {
      cm.replaceRange(symbol, {line: cursor.line, ch: 0}, {line: cursor.line, ch: 0})
    }
  }
  cm.setCursor({line: cursor.line, ch: cursor.ch + symbol.length})
  cm.focus()
}
