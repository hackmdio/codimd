/* eslint-env browser */
/* global CodeMirror, $, editor, Cookies */
import { options, Alignment, FormatType } from '@susisu/mte-kernel'
import debounce from 'lodash/debounce'

import * as utils from './utils'
import config from './config'
import statusBarTemplate from './statusbar.html'
import toolBarTemplate from './toolbar.html'
import { linterOptions } from './markdown-lint'
import CodeMirrorSpellChecker, { supportLanguages, supportLanguageCodes } from './spellcheck'
import { initTableEditor } from './table-editor'
import { availableThemes } from './constants'

// Storage utility class for localStorage operations
class Storage {
  static get (key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value !== null ? value : defaultValue
    } catch (e) {
      console.error('Error getting from localStorage:', e)
      return defaultValue
    }
  }

  static set (key, value, options = {}) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (e) {
      console.error('Error setting to localStorage:', e)
      return false
    }
  }

  static remove (key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error('Error removing from localStorage:', e)
      return false
    }
  }
}

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
        if (cm.getOption('fullScreen') && !(cm.getOption('keyMap').substr(0, 3) === 'vim')) {
          cm.setOption('fullScreen', false)
        } else {
          return CodeMirror.Pass
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
      Home: 'goLineLeftSmart',
      End: 'goLineRight',
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

    // define modes from mode mime
    const ignoreOverlay = {
      token: function (stream, state) {
        stream.next()
        return null
      }
    }

    CodeMirror.defineMode('c', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-csrc'), ignoreOverlay)
    })
    CodeMirror.defineMode('cpp', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-c++src'), ignoreOverlay)
    })
    CodeMirror.defineMode('java', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-java'), ignoreOverlay)
    })
    CodeMirror.defineMode('csharp', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-csharp'), ignoreOverlay)
    })
    CodeMirror.defineMode('objectivec', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-objectivec'), ignoreOverlay)
    })
    CodeMirror.defineMode('scala', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-scala'), ignoreOverlay)
    })
    CodeMirror.defineMode('kotlin', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-kotlin'), ignoreOverlay)
    })
    CodeMirror.defineMode('json', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'application/json'), ignoreOverlay)
    })
    CodeMirror.defineMode('jsonld', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'application/ld+json'), ignoreOverlay)
    })
    CodeMirror.defineMode('bash', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-sh'), ignoreOverlay)
    })
    CodeMirror.defineMode('ocaml', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'text/x-ocaml'), ignoreOverlay)
    })
    CodeMirror.defineMode('csvpreview', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'csv'), ignoreOverlay)
    })
    CodeMirror.defineMode('vega', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'application/ld+json'), ignoreOverlay)
    })

    CodeMirror.defineMode('markmap', function (config, modeConfig) {
      return CodeMirror.overlayMode(CodeMirror.getMode(config, 'gfm'), ignoreOverlay)
    })

    // Migrate preferences from cookies to localStorage
    this.migratePreferences()
  }

  // Migrate preferences from cookies to localStorage
  migratePreferences () {
    // Only run migration if window and localStorage are available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof Cookies === 'undefined') {
      return
    }

    const preferencesToMigrate = [
      'indent_type',
      'tab_size',
      'space_units',
      'keymap',
      'theme',
      'spellcheck',
      'linter',
      'preferences-override-browser-keymap',
      'preferences-disable-table-shortcuts'
    ]

    preferencesToMigrate.forEach(key => {
      // Check if preference exists in cookies but not in localStorage
      const cookieValue = Cookies.get(key)
      if (cookieValue !== undefined && Storage.get(key) === null) {
        // Migrate the preference to localStorage
        Storage.set(key, cookieValue)
        console.log(`Migrated preference ${key} from cookies to localStorage`)
      }
    })
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

  addToolBar () {
    this.toolBar = $(toolBarTemplate)
    this.toolbarPanel = this.editor.addPanel(this.toolBar[0], {
      position: 'top'
    })

    var makeBold = $('#makeBold')
    var makeItalic = $('#makeItalic')
    var makeStrike = $('#makeStrike')
    var makeHeader = $('#makeHeader')
    var makeCode = $('#makeCode')
    var makeQuote = $('#makeQuote')
    var makeGenericList = $('#makeGenericList')
    var makeOrderedList = $('#makeOrderedList')
    var makeCheckList = $('#makeCheckList')
    var makeLink = $('#makeLink')
    var makeImage = $('#makeImage')
    var makeTable = $('#makeTable')
    var makeLine = $('#makeLine')
    var makeComment = $('#makeComment')

    var insertRow = $('#insertRow')
    var deleteRow = $('#deleteRow')
    var moveRowUp = $('#moveRowUp')
    var moveRowDown = $('#moveRowDown')
    var insertColumn = $('#insertColumn')
    var deleteColumn = $('#deleteColumn')
    var moveColumnLeft = $('#moveColumnLeft')
    var moveColumnRight = $('#moveColumnRight')
    var alignLeft = $('#alignLeft')
    var alignCenter = $('#alignCenter')
    var alignRight = $('#alignRight')
    var alignNone = $('#alignNone')

    makeBold.click(() => {
      utils.wrapTextWith(this.editor, this.editor, '**')
      this.editor.focus()
    })

    makeItalic.click(() => {
      utils.wrapTextWith(this.editor, this.editor, '*')
      this.editor.focus()
    })

    makeStrike.click(() => {
      utils.wrapTextWith(this.editor, this.editor, '~~')
      this.editor.focus()
    })

    makeHeader.click(() => {
      utils.insertHeader(this.editor)
    })

    makeCode.click(() => {
      utils.wrapTextWith(this.editor, this.editor, '```')
      this.editor.focus()
    })

    makeQuote.click(() => {
      utils.insertOnStartOfLines(this.editor, '> ')
    })

    makeGenericList.click(() => {
      utils.insertOnStartOfLines(this.editor, '* ')
    })

    makeOrderedList.click(() => {
      utils.insertOnStartOfLines(this.editor, '1. ')
    })

    makeCheckList.click(() => {
      utils.insertOnStartOfLines(this.editor, '- [ ] ')
    })

    makeLink.click(() => {
      utils.insertLink(this.editor, false)
    })

    makeImage.click(() => {
      utils.insertLink(this.editor, true)
    })

    makeTable.click(() => {
      utils.insertText(this.editor, '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n')
    })

    makeLine.click(() => {
      utils.insertText(this.editor, '\n----\n')
    })

    makeComment.click(() => {
      utils.insertText(this.editor, '> []')
    })

    // table tools UI
    const opts = options({
      smartCursor: true,
      formatType: FormatType.NORMAL
    })

    insertRow.click(() => {
      this.tableEditor.insertRow(opts)
      this.editor.focus()
    })

    deleteRow.click(() => {
      this.tableEditor.deleteRow(opts)
      this.editor.focus()
    })

    moveRowUp.click(() => {
      this.tableEditor.moveRow(-1, opts)
      this.editor.focus()
    })

    moveRowDown.click(() => {
      this.tableEditor.moveRow(1, opts)
      this.editor.focus()
    })

    insertColumn.click(() => {
      this.tableEditor.insertColumn(opts)
      this.editor.focus()
    })

    deleteColumn.click(() => {
      this.tableEditor.deleteColumn(opts)
      this.editor.focus()
    })

    moveColumnLeft.click(() => {
      this.tableEditor.moveColumn(-1, opts)
      this.editor.focus()
    })

    moveColumnRight.click(() => {
      this.tableEditor.moveColumn(1, opts)
      this.editor.focus()
    })

    alignLeft.click(() => {
      this.tableEditor.alignColumn(Alignment.LEFT, opts)
      this.editor.focus()
    })

    alignCenter.click(() => {
      this.tableEditor.alignColumn(Alignment.CENTER, opts)
      this.editor.focus()
    })

    alignRight.click(() => {
      this.tableEditor.alignColumn(Alignment.RIGHT, opts)
      this.editor.focus()
    })

    alignNone.click(() => {
      this.tableEditor.alignColumn(Alignment.NONE, opts)
      this.editor.focus()
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
    this.statusLinter = this.statusBar.find('.status-linter')
    this.statusPreferences = this.statusBar.find('.status-preferences')
    this.statusPanel = this.editor.addPanel(this.statusBar[0], {
      position: 'bottom'
    })

    this.setIndent()
    this.setKeymap()
    this.setTheme()
    this.setSpellcheck()
    this.setLinter()
    this.setPreferences()

    this.handleStatusBarResize()
  }

  updateStatusBar () {
    if (!this.statusBar) return

    var cursor = this.editor.getCursor()
    var cursorText = 'Line ' + (cursor.line + 1) + ', Column ' + (cursor.ch + 1)
    this.statusCursor.text(cursorText)
    var fileText = ' — ' + editor.lineCount() + ' Lines'
    this.statusFile.text(fileText)
    var docLength = editor.getValue().length
    this.statusLength.text('Length ' + docLength)
    if (docLength > (config.docmaxlength * 0.95)) {
      this.statusLength.css('color', 'red')
      this.statusLength.attr('title', 'You have almost reached the limit for this document.')
    } else if (docLength > (config.docmaxlength * 0.8)) {
      this.statusLength.css('color', 'orange')
      this.statusLength.attr('title', 'This document is nearly full, consider splitting it or creating a new one.')
    } else {
      this.statusLength.css('color', 'white')
      this.statusLength.attr('title', 'You can write up to ' + config.docmaxlength + ' characters in this document.')
    }
  }

  handleStatusBarResize () {
    const onResize = debounce(() => {
      if (!this.statusBar) {
        return
      }

      const maxHeight = window.innerHeight - this.statusBar.height() - 50 /* navbar height */ - 10 /* spacing */
      this.statusBar.find('.status-theme ul.dropdown-menu').css('max-height', `${maxHeight}px`)
    }, 300)

    $(window).resize(onResize)

    onResize()
  }

  setIndent () {
    var storedIndentType = Storage.get('indent_type')
    var storedTabSize = parseInt(Storage.get('tab_size'))
    var storedSpaceUnits = parseInt(Storage.get('space_units'))
    if (storedIndentType) {
      if (storedIndentType === 'tab') {
        this.editor.setOption('indentWithTabs', true)
        if (storedTabSize) {
          this.editor.setOption('indentUnit', storedTabSize)
        }
      } else if (storedIndentType === 'space') {
        this.editor.setOption('indentWithTabs', false)
        if (storedSpaceUnits) {
          this.editor.setOption('indentUnit', storedSpaceUnits)
        }
      }
    }
    if (storedTabSize) {
      this.editor.setOption('tabSize', storedTabSize)
    }

    var type = this.statusIndicators.find('.indent-type')
    var widthLabel = this.statusIndicators.find('.indent-width-label')
    var widthInput = this.statusIndicators.find('.indent-width-input')

    const setType = () => {
      if (this.editor.getOption('indentWithTabs')) {
        Storage.set('indent_type', 'tab')
        type.text('Tab Size:')
      } else {
        Storage.set('indent_type', 'space')
        type.text('Spaces:')
      }
    }
    setType()

    const setUnit = () => {
      var unit = this.editor.getOption('indentUnit')
      if (this.editor.getOption('indentWithTabs')) {
        Storage.set('tab_size', unit)
      } else {
        Storage.set('space_units', unit)
      }
      widthLabel.text(unit)
    }
    setUnit()

    type.click(() => {
      if (this.editor.getOption('indentWithTabs')) {
        this.editor.setOption('indentWithTabs', false)
        storedSpaceUnits = parseInt(Storage.get('space_units'))
        if (storedSpaceUnits) {
          this.editor.setOption('indentUnit', storedSpaceUnits)
        }
      } else {
        this.editor.setOption('indentWithTabs', true)
        storedTabSize = parseInt(Storage.get('tab_size'))
        if (storedTabSize) {
          this.editor.setOption('indentUnit', storedTabSize)
          this.editor.setOption('tabSize', storedTabSize)
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
    var storedKeymap = Storage.get('keymap')
    if (storedKeymap) {
      this.editor.setOption('keyMap', storedKeymap)
    }

    var label = this.statusIndicators.find('.ui-keymap-label')
    var sublime = this.statusIndicators.find('.ui-keymap-sublime')
    var emacs = this.statusIndicators.find('.ui-keymap-emacs')
    var vim = this.statusIndicators.find('.ui-keymap-vim')

    const setKeymapLabel = () => {
      var keymap = this.editor.getOption('keyMap')
      Storage.set('keymap', keymap)
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
    this.statusIndicators.find('.status-theme ul.dropdown-menu').append(availableThemes.map(theme => {
      return $(`<li value="${theme.value}"><a>${theme.name}</a></li>`)
    }))

    const activateThemeListItem = (theme) => {
      this.statusIndicators.find('.status-theme li').removeClass('active')
      this.statusIndicators.find(`.status-theme li[value="${theme}"]`).addClass('active')
    }

    const setTheme = theme => {
      this.editor.setOption('theme', theme)
      Storage.set('theme', theme)
      this.statusIndicators.find('.status-theme li').removeClass('active')
      this.statusIndicators.find(`.status-theme li[value="${theme}"]`).addClass('active')
    }

    const storedTheme = Storage.get('theme')
    if (storedTheme && availableThemes.find(theme => storedTheme === theme.value)) {
      setTheme(storedTheme)
      activateThemeListItem(storedTheme)
    } else {
      activateThemeListItem(this.editor.getOption('theme'))
    }

    this.statusIndicators.find('.status-theme li').click(function () {
      const theme = $(this).attr('value')
      setTheme(theme)
      activateThemeListItem(theme)
    })
  }

  setSpellcheckLang (lang) {
    if (lang === 'disabled') {
      this.statusIndicators.find('.spellcheck-lang').text('')
      this.activateSpellcheckListItem(false)
      return
    }

    if (!supportLanguageCodes.includes(lang)) {
      return
    }

    const langName = this.statusIndicators.find(`.status-spellcheck li[value="${lang}"]`).text()
    this.statusIndicators.find('.spellcheck-lang').text(langName)

    this.spellchecker.setDictLang(lang)
    this.activateSpellcheckListItem(lang)
  }

  getExistingSpellcheckLang () {
    const storedSpellcheck = Storage.get('spellcheck')

    if (storedSpellcheck) {
      return storedSpellcheck === 'false' ? undefined : storedSpellcheck
    } else {
      return undefined
    }
  }

  activateSpellcheckListItem (lang) {
    this.statusIndicators.find('.status-spellcheck li').removeClass('active')

    if (lang) {
      this.statusIndicators.find(`.status-spellcheck li[value="${lang}"]`).addClass('active')
    } else {
      this.statusIndicators.find('.status-spellcheck li[value="disabled"]').addClass('active')
    }
  }

  setSpellcheck () {
    this.statusSpellcheck.find('ul.dropdown-menu').append(supportLanguages.map(lang => {
      return $(`<li value="${lang.value}"><a>${lang.name}</a></li>`)
    }))

    const storedSpellcheck = Storage.get('spellcheck')
    if (storedSpellcheck) {
      let mode = null
      let lang = 'en_US'

      if (storedSpellcheck === 'false' || !storedSpellcheck) {
        mode = defaultEditorMode
        this.activateSpellcheckListItem(false)
      } else {
        mode = 'spell-checker'
        if (supportLanguageCodes.includes(storedSpellcheck)) {
          lang = storedSpellcheck
        }
        this.setSpellcheckLang(lang)
      }

      this.editor.setOption('mode', mode)
    }

    const spellcheckToggle = this.statusSpellcheck.find('.ui-spellcheck-toggle')

    const checkSpellcheck = () => {
      var mode = this.editor.getOption('mode')
      if (mode === defaultEditorMode) {
        spellcheckToggle.removeClass('active')
      } else {
        spellcheckToggle.addClass('active')
      }
    }

    const self = this
    this.statusIndicators.find('.status-spellcheck li').click(function () {
      const lang = $(this).attr('value')

      if (lang === 'disabled') {
        spellcheckToggle.removeClass('active')

        Storage.set('spellcheck', 'false')

        self.editor.setOption('mode', defaultEditorMode)
      } else {
        spellcheckToggle.addClass('active')

        Storage.set('spellcheck', lang)

        self.editor.setOption('mode', 'spell-checker')
      }

      self.setSpellcheckLang(lang)
    })

    checkSpellcheck()
  }

  toggleLinter (enable) {
    const gutters = this.editor.getOption('gutters')
    const lintGutter = 'CodeMirror-lint-markers'

    if (enable) {
      if (!gutters.includes(lintGutter)) {
        this.editor.setOption('gutters', [lintGutter, ...gutters])
      }
      Storage.set('linter', 'true')
    } else {
      this.editor.setOption('gutters', gutters.filter(g => g !== lintGutter))
      Storage.remove('linter')
    }
    this.editor.setOption('lint', enable ? linterOptions : false)
  }

  setLinter () {
    const linterToggle = this.statusLinter.find('.ui-linter-toggle')

    const updateLinterStatus = (enable) => {
      linterToggle.toggleClass('active', enable)
    }

    linterToggle.click(() => {
      const lintEnable = !!this.editor.getOption('lint')
      this.toggleLinter.bind(this)(!lintEnable)
      updateLinterStatus(!lintEnable)
    })

    const enable = Storage.get('linter') === 'true'
    this.toggleLinter.bind(this)(enable)
    updateLinterStatus(enable)
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
      '.ui-preferences-override-browser-keymap label > input[type="checkbox"]'
    )
    if (overrideBrowserKeymap.is(':checked')) {
      Storage.set('preferences-override-browser-keymap', 'true')
      this.restoreOverrideEditorKeymap()
    } else {
      Storage.remove('preferences-override-browser-keymap')
      this.resetEditorKeymapToBrowserKeymap()
    }
  }

  setPreferences () {
    var overrideBrowserKeymap = $(
      '.ui-preferences-override-browser-keymap label > input[type="checkbox"]'
    )
    var storedOverrideBrowserKeymap = Storage.get(
      'preferences-override-browser-keymap'
    )
    if (storedOverrideBrowserKeymap && storedOverrideBrowserKeymap === 'true') {
      overrideBrowserKeymap.prop('checked', true)
    } else {
      overrideBrowserKeymap.prop('checked', false)
    }
    this.setOverrideBrowserKeymap()

    overrideBrowserKeymap.change(() => {
      this.setOverrideBrowserKeymap()
    })

    // Handle table editor shortcuts preference
    var disableTableShortcuts = $(
      '.ui-preferences-disable-table-shortcuts label > input[type="checkbox"]'
    )
    var storedDisableTableShortcuts = Storage.get(
      'preferences-disable-table-shortcuts'
    )
    if (storedDisableTableShortcuts && storedDisableTableShortcuts === 'true') {
      disableTableShortcuts.prop('checked', true)
    } else {
      disableTableShortcuts.prop('checked', false)
    }
    this.setTableShortcutsPreference()

    disableTableShortcuts.change(() => {
      this.setTableShortcutsPreference()
    })
  }

  setTableShortcutsPreference () {
    var disableTableShortcuts = $(
      '.ui-preferences-disable-table-shortcuts label > input[type="checkbox"]'
    )
    if (disableTableShortcuts.is(':checked')) {
      Storage.set('preferences-disable-table-shortcuts', 'true')
    } else {
      Storage.remove('preferences-disable-table-shortcuts')
    }
    // Notify table editor about the preference change
    if (this.tableEditor) {
      this.tableEditor.setShortcutsEnabled(!disableTableShortcuts.is(':checked'))
    }
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

    this.spellchecker = new CodeMirrorSpellChecker(CodeMirror, this.getExistingSpellcheckLang(), this.editor)
    this.tableEditor = initTableEditor(this.editor)

    return this.editor
  }

  getEditor () {
    return this.editor
  }
}
