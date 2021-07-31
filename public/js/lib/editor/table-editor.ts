/* global CodeMirror, $ */
import { TableEditor, Point, options, Alignment, FormatType } from '@susisu/mte-kernel'

// port of the code from: https://github.com/susisu/mte-demo/blob/master/src/main.js

// text editor interface
// see https://doc.esdoc.org/github.com/susisu/mte-kernel/class/lib/text-editor.js~ITextEditor.html
class TextEditorInterface {
  constructor (editor) {
    this.editor = editor
    this.doc = editor.getDoc()
    this.transaction = false
    this.onDidFinishTransaction = null
  }

  getCursorPosition () {
    const { line, ch } = this.doc.getCursor()
    return new Point(line, ch)
  }

  setCursorPosition (pos) {
    this.doc.setCursor({ line: pos.row, ch: pos.column })
  }

  setSelectionRange (range) {
    this.doc.setSelection(
      { line: range.start.row, ch: range.start.column },
      { line: range.end.row, ch: range.end.column }
    )
  }

  getLastRow () {
    return this.doc.lineCount() - 1
  }

  acceptsTableEdit () {
    return true
  }

  getLine (row) {
    return this.doc.getLine(row)
  }

  insertLine (row, line) {
    const lastRow = this.getLastRow()
    if (row > lastRow) {
      const lastLine = this.getLine(lastRow)
      this.doc.replaceRange(
        '\n' + line,
        { line: lastRow, ch: lastLine.length },
        { line: lastRow, ch: lastLine.length }
      )
    } else {
      this.doc.replaceRange(
        line + '\n',
        { line: row, ch: 0 },
        { line: row, ch: 0 }
      )
    }
  }

  deleteLine (row) {
    const lastRow = this.getLastRow()
    if (row >= lastRow) {
      if (lastRow > 0) {
        const preLastLine = this.getLine(lastRow - 1)
        const lastLine = this.getLine(lastRow)
        this.doc.replaceRange(
          '',
          { line: lastRow - 1, ch: preLastLine.length },
          { line: lastRow, ch: lastLine.length }
        )
      } else {
        const lastLine = this.getLine(lastRow)
        this.doc.replaceRange(
          '',
          { line: lastRow, ch: 0 },
          { line: lastRow, ch: lastLine.length }
        )
      }
    } else {
      this.doc.replaceRange(
        '',
        { line: row, ch: 0 },
        { line: row + 1, ch: 0 }
      )
    }
  }

  replaceLines (startRow, endRow, lines) {
    const lastRow = this.getLastRow()
    if (endRow > lastRow) {
      const lastLine = this.getLine(lastRow)
      this.doc.replaceRange(
        lines.join('\n'),
        { line: startRow, ch: 0 },
        { line: lastRow, ch: lastLine.length }
      )
    } else {
      this.doc.replaceRange(
        lines.join('\n') + '\n',
        { line: startRow, ch: 0 },
        { line: endRow, ch: 0 }
      )
    }
  }

  transact (func) {
    this.transaction = true
    func()
    this.transaction = false
    if (this.onDidFinishTransaction) {
      this.onDidFinishTransaction.call(undefined)
    }
  }
}

export function initTableEditor (editor) {
  // create an interface to the text editor
  const editorIntf = new TextEditorInterface(editor)
  // create a table editor object
  const tableEditor = new TableEditor(editorIntf)
  // options for the table editor
  const opts = options({
    smartCursor: true,
    formatType: FormatType.NORMAL
  })
  // keymap of the commands
  // from https://github.com/susisu/mte-demo/blob/master/src/main.js
  const keyMap = CodeMirror.normalizeKeyMap({
    Tab: () => { tableEditor.nextCell(opts) },
    'Shift-Tab': () => { tableEditor.previousCell(opts) },
    Enter: () => { tableEditor.nextRow(opts) },
    'Ctrl-Enter': () => { tableEditor.escape(opts) },
    'Cmd-Enter': () => { tableEditor.escape(opts) },
    'Shift-Ctrl-Left': () => { tableEditor.alignColumn(Alignment.LEFT, opts) },
    'Shift-Cmd-Left': () => { tableEditor.alignColumn(Alignment.LEFT, opts) },
    'Shift-Ctrl-Right': () => { tableEditor.alignColumn(Alignment.RIGHT, opts) },
    'Shift-Cmd-Right': () => { tableEditor.alignColumn(Alignment.RIGHT, opts) },
    'Shift-Ctrl-Up': () => { tableEditor.alignColumn(Alignment.CENTER, opts) },
    'Shift-Cmd-Up': () => { tableEditor.alignColumn(Alignment.CENTER, opts) },
    'Shift-Ctrl-Down': () => { tableEditor.alignColumn(Alignment.NONE, opts) },
    'Shift-Cmd-Down': () => { tableEditor.alignColumn(Alignment.NONE, opts) },
    'Ctrl-Left': () => { tableEditor.moveFocus(0, -1, opts) },
    'Cmd-Left': () => { tableEditor.moveFocus(0, -1, opts) },
    'Ctrl-Right': () => { tableEditor.moveFocus(0, 1, opts) },
    'Cmd-Right': () => { tableEditor.moveFocus(0, 1, opts) },
    'Ctrl-Up': () => { tableEditor.moveFocus(-1, 0, opts) },
    'Cmd-Up': () => { tableEditor.moveFocus(-1, 0, opts) },
    'Ctrl-Down': () => { tableEditor.moveFocus(1, 0, opts) },
    'Cmd-Down': () => { tableEditor.moveFocus(1, 0, opts) },
    'Ctrl-K Ctrl-I': () => { tableEditor.insertRow(opts) },
    'Cmd-K Cmd-I': () => { tableEditor.insertRow(opts) },
    'Ctrl-L Ctrl-I': () => { tableEditor.deleteRow(opts) },
    'Cmd-L Cmd-I': () => { tableEditor.deleteRow(opts) },
    'Ctrl-K Ctrl-J': () => { tableEditor.insertColumn(opts) },
    'Cmd-K Cmd-J': () => { tableEditor.insertColumn(opts) },
    'Ctrl-L Ctrl-J': () => { tableEditor.deleteColumn(opts) },
    'Cmd-L Cmd-J': () => { tableEditor.deleteColumn(opts) },
    'Alt-Shift-Ctrl-Left': () => { tableEditor.moveColumn(-1, opts) },
    'Alt-Shift-Cmd-Left': () => { tableEditor.moveColumn(-1, opts) },
    'Alt-Shift-Ctrl-Right': () => { tableEditor.moveColumn(1, opts) },
    'Alt-Shift-Cmd-Right': () => { tableEditor.moveColumn(1, opts) },
    'Alt-Shift-Ctrl-Up': () => { tableEditor.moveRow(-1, opts) },
    'Alt-Shift-Cmd-Up': () => { tableEditor.moveRow(-1, opts) },
    'Alt-Shift-Ctrl-Down': () => { tableEditor.moveRow(1, opts) },
    'Alt-Shift-Cmd-Down': () => { tableEditor.moveRow(1, opts) }
  })
  let lastActive
  // enable keymap if the cursor is in a table
  function updateActiveState () {
    const tableTools = $('.toolbar .table-tools')
    const active = tableEditor.cursorIsInTable(opts)
    // avoid to update if state not changed
    if (lastActive === active) {
      return
    }
    if (active) {
      tableTools.show()
      tableTools.parent().scrollLeft(tableTools.parent()[0].scrollWidth)
      editor.addKeyMap(keyMap)
    } else {
      tableTools.hide()
      editor.removeKeyMap(keyMap)
      tableEditor.resetSmartCursor()
    }
    lastActive = active
  }
  // event subscriptions
  editor.on('cursorActivity', () => {
    if (!editorIntf.transaction) {
      updateActiveState()
    }
  })
  editor.on('changes', () => {
    if (!editorIntf.transaction) {
      updateActiveState()
    }
  })
  editorIntf.onDidFinishTransaction = () => {
    updateActiveState()
  }

  return tableEditor
}
