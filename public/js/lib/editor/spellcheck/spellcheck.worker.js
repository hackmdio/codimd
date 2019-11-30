import Typo from 'typo-js'
import { tokenizer } from './tokenizer'

let dictionaryDownloadUrls = {}
const typoMap = new Map()
let typo

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

/**
 * @param {string} lang
 */
async function findOrCreateTypoInstance (lang) {
  // find existing typo instance
  let typo = typoMap.get(lang)
  if (typo) {
    return typo
  }

  const [affData, dicData] = await mapSeriesP([
    dictionaryDownloadUrls[lang].aff,
    dictionaryDownloadUrls[lang].dic
  ], request)

  typo = createTypo(lang, affData, dicData)
  typoMap.set(lang, typo)

  return typo
}

/* Worker exposed methods */

export function initializeDictionaryUrls (urls) {
  dictionaryDownloadUrls = urls
}

/**
 * @param {string} lang
 */
export async function setSpellChckerLang (lang) {
  typo = await findOrCreateTypoInstance(lang)
}

/**
 * @param {string} text
 */
export function check (text) {
  const tokens = tokenizer(text)

  return tokens.map(token => {
    if (typo && !typo.check(word)) {
      return {
        ...token,
        severity: 'error',
      }
    } else {
      // no error
      return null
    }
  }).filter(Boolean)
}

