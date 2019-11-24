/* eslint-env browser */

// Modified from https://github.com/sparksuite/codemirror-spell-checker

import Typo from 'typo-js'
import { serverurl } from '../config'

const dictionaryDownloadUrls = {
  en_US: {
    aff: `${serverurl}/vendor/codemirror-spell-checker/en_US.aff`,
    dic: `${serverurl}/vendor/codemirror-spell-checker/en_US.dic`
  }
}

class CodeMirrorSpellChecker {
  /**
   * @param {CodeMirror} cm
   * @param {string} lang
   */
  constructor (cm, lang = 'en_US') {
    // Verify
    if (typeof cm !== 'function' || typeof cm.defineMode !== 'function') {
      console.log(
        'CodeMirror Spell Checker: You must provide an instance of CodeMirror via the option `codeMirrorInstance`'
      )
      return
    }

    this.numLoaded = 0
    this.affLoading = false
    this.dicLoading = false
    this.affData = ''
    this.dicData = ''
    this.typo = undefined

    this.setupCM.bind(this)(cm, lang)
  }

  setupCM (cm, lang) {
    cm.defineMode('spell-checker', config => {
      // Load AFF/DIC data
      if (!this.affLoading) {
        this.affLoading = true

        const xhrAff = new XMLHttpRequest()
        xhrAff.open('GET', dictionaryDownloadUrls[lang].aff, true)
        xhrAff.onload = () => {
          if (xhrAff.readyState === 4 && xhrAff.status === 200) {
            this.affData = xhrAff.responseText
            this.numLoaded++

            if (this.numLoaded === 2) {
              this.typo = new Typo(lang, this.affData, this.dicData, { platform: 'any' })
            }
          }
        }
        xhrAff.send(null)
      }

      if (!this.dicLoading) {
        this.dicLoading = true
        const xhrDic = new XMLHttpRequest()
        xhrDic.open('GET', dictionaryDownloadUrls[lang].dic, true)
        xhrDic.onload = () => {
          if (xhrDic.readyState === 4 && xhrDic.status === 200) {
            this.dicData = xhrDic.responseText
            this.numLoaded++

            if (this.numLoaded === 2) {
              this.typo = new Typo(lang, this.affData, this.dicData, { platform: 'any' })
            }
          }
        }
        xhrDic.send(null)
      }

      // Define what separates a word
      const regexWord = '!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ '

      // Create the overlay and such
      const overlay = {
        token: (stream) => {
          let ch = stream.peek()
          let word = ''

          if (regexWord.includes(ch)) {
            stream.next()
            return null
          }

          while ((ch = stream.peek()) != null && !regexWord.includes(ch)) {
            word += ch
            stream.next()
          }

          if (this.typo && !this.typo.check(word)) {
            return 'spell-error' // CSS class: cm-spell-error
          }

          return null
        }
      }

      const mode = cm.getMode(config, config.backdrop || 'text/plain')

      return cm.overlayMode(mode, overlay, true)
    })
  }
}

// Export
export default CodeMirrorSpellChecker
