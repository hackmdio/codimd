import { serverurl } from '../../config'
import worker from './spellcheck.worker'

const spellcheckWorker = worker()

const dictionaryDownloadUrls = {
  en_US: {
    aff: `${serverurl}/vendor/codemirror-spell-checker/en_US.aff`,
    dic: `${serverurl}/vendor/codemirror-spell-checker/en_US.dic`
  },
  de: {
    aff: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de/index.aff',
    dic: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de/index.dic'
  },
  de_AT: {
    aff: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de-AT/index.aff',
    dic: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de-AT/index.dic'
  },
  de_CH: {
    aff: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de-CH/index.aff',
    dic: 'https://rawcdn.githack.com/wooorm/dictionaries/143091715eebbbdfa0e8936e117f9182514eebe6/dictionaries/de-CH/index.dic'
  }
}

export const supportLanguages = Object.keys(dictionaryDownloadUrls)

(function (mod) {
  mod(CodeMirror)
})(function (CodeMirror) {
  spellcheckWorker

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
        messageHTML: `${ruleNames.join('/')}: ${ruleDescription}`,
        severity: 'error',
        from: CodeMirror.Pos(lineNumber, start),
        to: CodeMirror.Pos(lineNumber, end)
      }
    })
  }

  CodeMirror.registerHelper('lint', 'markdown', validator)
})
