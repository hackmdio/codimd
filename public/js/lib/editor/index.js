import * as utils from './utils'
import config from './config'
import statusBarTemplate from './statusbar.html'

/* config section */
const isMac = CodeMirror.keyMap.default === CodeMirror.keyMap.macDefault
const defaultEditorMode = 'gfm'
const viewportMargin = 20

const jumpToAddressBarKeymapName = isMac ? 'Cmd-L' : 'Ctrl-L'

export default class Editor {
  constructor () {
    this.editor = null
    this.jumpToAddressBarKeymapValue = null
    this.defaultExtraKeys = {
      F10: function (cm) {
        cm.setOption('fullScreen', !cm.getOption('fullScreen'))
      },
      Esc: function (cm) {
        if (cm.getOption('keyMap').substr(0, 3) === 'vim') {
          return CodeMirror.Pass
        } else if (cm.getOption('fullScreen')) {
          cm.setOption('fullScreen', false)
        }
      },
      'Cmd-S': function () {
        return false
      },
      'Ctrl-S': function () {
        return false
      },
      Enter: 'newlineAndIndentContinueMarkdownList',
      Tab: function (cm) {
        var tab = '\t'

        // contruct x length spaces
        var spaces = Array(parseInt(cm.getOption('indentUnit')) + 1).join(' ')

        // auto indent whole line when in list or blockquote
        var cursor = cm.getCursor()
        var line = cm.getLine(cursor.line)

        // this regex match the following patterns
        // 1. blockquote starts with "> " or ">>"
        // 2. unorder list starts with *+-
        // 3. order list starts with "1." or "1)"
        var regex = /^(\s*)(>[> ]*|[*+-]\s|(\d+)([.)]))/

        var match
        var multiple = cm.getSelection().split('\n').length > 1 ||
          cm.getSelections().length > 1

        if (multiple) {
          cm.execCommand('defaultTab')
        } else if ((match = regex.exec(line)) !== null) {
          var ch = match[1].length
          var pos = {
            line: cursor.line,
            ch: ch
          }
          if (cm.getOption('indentWithTabs')) {
            cm.replaceRange(tab, pos, pos, '+input')
          } else {
            cm.replaceRange(spaces, pos, pos, '+input')
          }
        } else {
          if (cm.getOption('indentWithTabs')) {
            cm.execCommand('defaultTab')
          } else {
            cm.replaceSelection(spaces)
          }
        }
      },
      'Cmd-Left': 'goLineLeftSmart',
      'Cmd-Right': 'goLineRight',
      'Ctrl-C': function (cm) {
        if (!isMac && cm.getOption('keyMap').substr(0, 3) === 'vim') {
          document.execCommand('copy')
        } else {
          return CodeMirror.Pass
        }
      },
      'Ctrl-*': cm => {
        utils.wrapTextWith(this.editor, cm, '*')
      },
      'Shift-Ctrl-8': cm => {
        utils.wrapTextWith(this.editor, cm, '*')
      },
      'Ctrl-_': cm => {
        utils.wrapTextWith(this.editor, cm, '_')
      },
      'Shift-Ctrl--': cm => {
        utils.wrapTextWith(this.editor, cm, '_')
      },
      'Ctrl-~': cm => {
        utils.wrapTextWith(this.editor, cm, '~')
      },
      'Shift-Ctrl-`': cm => {
        utils.wrapTextWith(this.editor, cm, '~')
      },
      'Ctrl-^': cm => {
        utils.wrapTextWith(this.editor, cm, '^')
      },
      'Shift-Ctrl-6': cm => {
        utils.wrapTextWith(this.editor, cm, '^')
      },
      'Ctrl-+': cm => {
        utils.wrapTextWith(this.editor, cm, '+')
      },
      'Shift-Ctrl-=': cm => {
        utils.wrapTextWith(this.editor, cm, '+')
      },
      'Ctrl-=': cm => {
        utils.wrapTextWith(this.editor, cm, '=')
      },
      'Shift-Ctrl-Backspace': cm => {
        utils.wrapTextWith(this.editor, cm, 'Backspace')
      }
    }
    this.eventListeners = {}
    this.config = config
  }

  on (event, cb) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [cb]
    } else {
      this.eventListeners[event].push(cb)
    }

    this.editor.on(event, (...args) => {
      this.eventListeners[event].forEach(cb => cb.bind(this)(...args))
    })
  }

  addStatusBar () {
    this.statusBar = $(statusBarTemplate)
    this.statusCursor = this.statusBar.find('.status-cursor > .status-line-column')
    this.statusSelection = this.statusBar.find('.status-cursor > .status-selection')
    this.statusFile = this.statusBar.find('.status-file')
    this.statusIndicators = this.statusBar.find('.status-indicators')
    this.statusIndent = this.statusBar.find('.status-indent')
    this.statusKeymap = this.statusBar.find('.status-keymap')
    this.statusLength = this.statusBar.find('.status-length')
    this.statusTheme = this.statusBar.find('.status-theme')
    this.statusSpellcheck = this.statusBar.find('.status-spellcheck')
    this.statusPreferences = this.statusBar.find('.status-preferences')
    this.statusPanel = this.editor.addPanel(this.statusBar[0], {
      position: 'bottom'
    })

    this.setIndent()
    this.setKeymap()
    this.setTheme()
    this.setSpellcheck()
    this.setPreferences()
  }

  updateStatusBar () {
    if (!this.statusBar) return

    var cursor = this.editor.getCursor()
    var cursorText = 'Line ' + (cursor.line + 1) + ', Columns ' + (cursor.ch + 1)
    this.statusCursor.text(cursorText)
    var fileText = ' — ' + editor.lineCount() + ' Lines'
    this.statusFile.text(fileText)
    var docLength = editor.getValue().length
    this.statusLength.text('Length ' + docLength)
    if (docLength > (config.docmaxlength * 0.95)) {
      this.statusLength.css('color', 'red')
      this.statusLength.attr('title', 'Your almost reach note max length limit.')
    } else if (docLength > (config.docmaxlength * 0.8)) {
      this.statusLength.css('color', 'orange')
      this.statusLength.attr('title', 'You nearly fill the note, consider to make more pieces.')
    } else {
      this.statusLength.css('color', 'white')
      this.statusLength.attr('title', 'You could write up to ' + config.docmaxlength + ' characters in this note.')
    }
  }

  setIndent () {
    var cookieIndentType = Cookies.get('indent_type')
    var cookieTabSize = parseInt(Cookies.get('tab_size'))
    var cookieSpaceUnits = parseInt(Cookies.get('space_units'))
    if (cookieIndentType) {
      if (cookieIndentType === 'tab') {
        this.editor.setOption('indentWithTabs', true)
        if (cookieTabSize) {
          this.editor.setOption('indentUnit', cookieTabSize)
        }
      } else if (cookieIndentType === 'space') {
        this.editor.setOption('indentWithTabs', false)
        if (cookieSpaceUnits) {
          this.editor.setOption('indentUnit', cookieSpaceUnits)
        }
      }
    }
    if (cookieTabSize) {
      this.editor.setOption('tabSize', cookieTabSize)
    }

    var type = this.statusIndicators.find('.indent-type')
    var widthLabel = this.statusIndicators.find('.indent-width-label')
    var widthInput = this.statusIndicators.find('.indent-width-input')

    const setType = () => {
      if (this.editor.getOption('indentWithTabs')) {
        Cookies.set('indent_type', 'tab', {
          expires: 365
        })
        type.text('Tab Size:')
      } else {
        Cookies.set('indent_type', 'space', {
          expires: 365
        })
        type.text('Spaces:')
      }
    }
    setType()

    const setUnit = () => {
      var unit = this.editor.getOption('indentUnit')
      if (this.editor.getOption('indentWithTabs')) {
        Cookies.set('tab_size', unit, {
          expires: 365
        })
      } else {
        Cookies.set('space_units', unit, {
          expires: 365
        })
      }
      widthLabel.text(unit)
    }
    setUnit()

    type.click(() => {
      if (this.editor.getOption('indentWithTabs')) {
        this.editor.setOption('indentWithTabs', false)
        cookieSpaceUnits = parseInt(Cookies.get('space_units'))
        if (cookieSpaceUnits) {
          this.editor.setOption('indentUnit', cookieSpaceUnits)
        }
      } else {
        this.editor.setOption('indentWithTabs', true)
        cookieTabSize = parseInt(Cookies.get('tab_size'))
        if (cookieTabSize) {
          this.editor.setOption('indentUnit', cookieTabSize)
          this.editor.setOption('tabSize', cookieTabSize)
        }
      }
      setType()
      setUnit()
    })
    widthLabel.click(() => {
      if (widthLabel.is(':visible')) {
        widthLabel.addClass('hidden')
        widthInput.removeClass('hidden')
        widthInput.val(this.editor.getOption('indentUnit'))
        widthInput.select()
      } else {
        widthLabel.removeClass('hidden')
        widthInput.addClass('hidden')
      }
    })
    widthInput.on('change', () => {
      var val = parseInt(widthInput.val())
      if (!val) val = this.editor.getOption('indentUnit')
      if (val < 1) val = 1
      else if (val > 10) val = 10

      if (this.editor.getOption('indentWithTabs')) {
        this.editor.setOption('tabSize', val)
      }
      this.editor.setOption('indentUnit', val)
      setUnit()
    })
    widthInput.on('blur', function () {
      widthLabel.removeClass('hidden')
      widthInput.addClass('hidden')
    })
  }

  setKeymap () {
    var cookieKeymap = Cookies.get('keymap')
    if (cookieKeymap) {
      this.editor.setOption('keyMap', cookieKeymap)
    }

    var label = this.statusIndicators.find('.ui-keymap-label')
    var sublime = this.statusIndicators.find('.ui-keymap-sublime')
    var emacs = this.statusIndicators.find('.ui-keymap-emacs')
    var vim = this.statusIndicators.find('.ui-keymap-vim')

    const setKeymapLabel = () => {
      var keymap = this.editor.getOption('keyMap')
      Cookies.set('keymap', keymap, {
        expires: 365
      })
      label.text(keymap)
      this.restoreOverrideEditorKeymap()
      this.setOverrideBrowserKeymap()
    }
    setKeymapLabel()

    sublime.click(() => {
      this.editor.setOption('keyMap', 'sublime')
      setKeymapLabel()
    })
    emacs.click(() => {
      this.editor.setOption('keyMap', 'emacs')
      setKeymapLabel()
    })
    vim.click(() => {
      this.editor.setOption('keyMap', 'vim')
      setKeymapLabel()
    })
  }

  setTheme () {
    var cookieTheme = Cookies.get('theme')
    if (cookieTheme) {
      this.editor.setOption('theme', cookieTheme)
    }

    var themeToggle = this.statusTheme.find('.ui-theme-toggle')

    const checkTheme = () => {
      var theme = this.editor.getOption('theme')
      if (theme === 'one-dark') {
        themeToggle.removeClass('active')
      } else {
        themeToggle.addClass('active')
      }
    }

    themeToggle.click(() => {
      var theme = this.editor.getOption('theme')
      if (theme === 'one-dark') {
        theme = 'default'
      } else {
        theme = 'one-dark'
      }
      this.editor.setOption('theme', theme)
      Cookies.set('theme', theme, {
        expires: 365
      })

      checkTheme()
    })

    checkTheme()
  }

  setSpellcheck () {
    var cookieSpellcheck = Cookies.get('spellcheck')
    if (cookieSpellcheck) {
      var mode = null
      if (cookieSpellcheck === 'true' || cookieSpellcheck === true) {
        mode = 'spell-checker'
      } else {
        mode = defaultEditorMode
      }
      if (mode && mode !== this.editor.getOption('mode')) {
        this.editor.setOption('mode', mode)
      }
    }

    var spellcheckToggle = this.statusSpellcheck.find('.ui-spellcheck-toggle')

    const checkSpellcheck = () => {
      var mode = this.editor.getOption('mode')
      if (mode === defaultEditorMode) {
        spellcheckToggle.removeClass('active')
      } else {
        spellcheckToggle.addClass('active')
      }
    }

    spellcheckToggle.click(() => {
      var mode = this.editor.getOption('mode')
      if (mode === defaultEditorMode) {
        mode = 'spell-checker'
      } else {
        mode = defaultEditorMode
      }
      if (mode && mode !== this.editor.getOption('mode')) {
        this.editor.setOption('mode', mode)
      }
      Cookies.set('spellcheck', mode === 'spell-checker', {
        expires: 365
      })

      checkSpellcheck()
    })

    checkSpellcheck()

    // workaround spellcheck might not activate beacuse the ajax loading
    if (window.num_loaded < 2) {
      var spellcheckTimer = setInterval(
        () => {
          if (window.num_loaded >= 2) {
            if (this.editor.getOption('mode') === 'spell-checker') {
              this.editor.setOption('mode', 'spell-checker')
            }
            clearInterval(spellcheckTimer)
          }
        },
        100,
      )
    }
  }

  resetEditorKeymapToBrowserKeymap () {
    var keymap = this.editor.getOption('keyMap')
    if (!this.jumpToAddressBarKeymapValue) {
      this.jumpToAddressBarKeymapValue = CodeMirror.keyMap[keymap][jumpToAddressBarKeymapName]
      delete CodeMirror.keyMap[keymap][jumpToAddressBarKeymapName]
    }
  }

  restoreOverrideEditorKeymap () {
    var keymap = this.editor.getOption('keyMap')
    if (this.jumpToAddressBarKeymapValue) {
      CodeMirror.keyMap[keymap][jumpToAddressBarKeymapName] = this.jumpToAddressBarKeymapValue
      this.jumpToAddressBarKeymapValue = null
    }
  }
  setOverrideBrowserKeymap () {
    var overrideBrowserKeymap = $(
      '.ui-preferences-override-browser-keymap label > input[type="checkbox"]',
    )
    if (overrideBrowserKeymap.is(':checked')) {
      Cookies.set('preferences-override-browser-keymap', true, {
        expires: 365
      })
      this.restoreOverrideEditorKeymap()
    } else {
      Cookies.remove('preferences-override-browser-keymap')
      this.resetEditorKeymapToBrowserKeymap()
    }
  }

  setPreferences () {
    var overrideBrowserKeymap = $(
      '.ui-preferences-override-browser-keymap label > input[type="checkbox"]',
    )
    var cookieOverrideBrowserKeymap = Cookies.get(
      'preferences-override-browser-keymap',
    )
    if (cookieOverrideBrowserKeymap && cookieOverrideBrowserKeymap === 'true') {
      overrideBrowserKeymap.prop('checked', true)
    } else {
      overrideBrowserKeymap.prop('checked', false)
    }
    this.setOverrideBrowserKeymap()

    overrideBrowserKeymap.change(() => {
      this.setOverrideBrowserKeymap()
    })
  }

  init (textit) {
    this.editor = CodeMirror.fromTextArea(textit, {
      mode: defaultEditorMode,
      backdrop: defaultEditorMode,
      keyMap: 'sublime',
      viewportMargin: viewportMargin,
      styleActiveLine: true,
      lineNumbers: true,
      lineWrapping: true,
      showCursorWhenSelecting: true,
      highlightSelectionMatches: true,
      indentUnit: 4,
      continueComments: 'Enter',
      theme: 'one-dark',
      inputStyle: 'textarea',
      matchBrackets: true,
      autoCloseBrackets: true,
      matchTags: {
        bothTags: true
      },
      autoCloseTags: true,
      foldGutter: true,
      gutters: [
        'CodeMirror-linenumbers',
        'authorship-gutters',
        'CodeMirror-foldgutter'
      ],
      extraKeys: this.defaultExtraKeys,
      flattenSpans: true,
      addModeClass: true,
      readOnly: true,
      autoRefresh: true,
      otherCursors: true,
      placeholder: "← Start by entering a title here\n===\nVisit /features if you don't know what to do.\nHappy hacking :)"
    })

    return this.editor
  }

  getEditor () {
    return this.editor
  }
}
