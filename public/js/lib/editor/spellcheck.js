/* eslint-env browser */

// Modified from https://github.com/sparksuite/codemirror-spell-checker

import Typo from 'typo-js'
import { serverurl } from '../config'

export const supportLanguages = [
  {
    name: 'English (United States)',
    value: 'en_US',
    aff: {
      url: `${serverurl}/vendor/codemirror-spell-checker/en_US.aff`,
      cdnUrl: `${serverurl}/vendor/codemirror-spell-checker/en_US.aff`
    },
    dic: {
      url: `${serverurl}/vendor/codemirror-spell-checker/en_US.dic`,
      cdnUrl: `${serverurl}/vendor/codemirror-spell-checker/en_US.dic`
    }
  },
  {
    name: 'German',
    value: 'de',
    aff: {
      url: `${serverurl}/build/dictionary-de/index.aff`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de@2.0.3/index.aff'
    },
    dic: {
      url: `${serverurl}/build/dictionary-de/index.dic`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de@2.0.3/index.dic'
    }
  },
  {
    name: 'German (Austria)',
    value: 'de_AT',
    aff: {
      url: `${serverurl}/build/dictionary-de-at/index.aff`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de-at@2.0.3/index.aff'
    },
    dic: {
      url: `${serverurl}/build/dictionary-de-at/index.dic`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de-at@2.0.3/index.dic'
    }
  },
  {
    name: 'German (Switzerland)',
    value: 'de_CH',
    aff: {
      url: `${serverurl}/build/dictionary-de-ch/index.aff`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de-ch@2.0.3/index.aff'
    },
    dic: {
      url: `${serverurl}/build/dictionary-de-ch/index.dic`,
      cdnUrl: 'https://cdn.jsdelivr.net/npm/dictionary-de-ch@2.0.3/index.dic'
    }
  }
]

export const supportLanguageCodes = supportLanguages.map(lang => lang.value)

function request (url) {
  return new Promise(resolve => {
    const req = new XMLHttpRequest()
    req.open('GET', url, true)
    req.onload = () => {
      if (req.readyState === 4 && req.status === 200) {
        resolve(req.responseText)
      }
    }
    req.send(null)
  })
}

async function runSeriesP (iterables, fn) {
  const results = []
  for (const iterable of iterables) {
    results.push(await fn(iterable))
  }
  return results
}

function mapSeriesP (iterables, fn) {
  return new Promise(resolve => {
    resolve(runSeriesP(iterables, fn))
  })
}

function createTypo (lang, affData, dicData) {
  return new Typo(lang, affData, dicData, { platform: 'any' })
}

const typoMap = new Map()

let fetching = false
async function findOrCreateTypoInstance (lang) {
  if (!lang) {
    return
  }

  // find existing typo instance
  let typo = typoMap.get(lang)
  if (typo) {
    return typo
  }

  let dict = supportLanguages.find(l => l.value === lang)

  if (!dict) {
    console.error(`Dictionary not found for "${lang}"\n Fallback to default English spellcheck`)
    dict = supportLanguages[0]
  }

  let affUrl
  let dicUrl
  if (window.USE_CDN) {
    affUrl = dict.aff.cdnUrl
    dicUrl = dict.dic.cdnUrl
  } else {
    affUrl = dict.aff.url
    dicUrl = dict.dic.url
  }

  if (fetching) {
    return typo
  }

  try {
    fetching = true

    const [affData, dicData] = await mapSeriesP([affUrl, dicUrl], request)

    typo = createTypo(lang, affData, dicData)
    typoMap.set(lang, typo)
  } catch (err) {
    console.error(err)
  } finally {
    fetching = false
  }

  return typo
}

class CodeMirrorSpellChecker {
  /**
   * @param {CodeMirror} cm
   * @param {string} lang
   */
  constructor (cm, lang, editor) {
    // Verify
    if (typeof cm !== 'function' || typeof cm.defineMode !== 'function') {
      console.log(
        'CodeMirror Spell Checker: You must provide an instance of CodeMirror via the option `codeMirrorInstance`'
      )
      return
    }

    this.typo = undefined
    this.defineSpellCheckerMode(cm, lang)
    this.editor = editor
  }

  setDictLang (lang) {
    findOrCreateTypoInstance(lang).then(typo => {
      this.typo = typo

      // re-enable overlay mode to refresh spellcheck
      this.editor.setOption('mode', 'gfm')
      this.editor.setOption('mode', 'spell-checker')
    })
  }

  defineSpellCheckerMode (cm, lang) {
    // Load AFF/DIC data async ASAP
    this.setDictLang(lang)

    cm.defineMode('spell-checker', config => {
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

export default CodeMirrorSpellChecker
