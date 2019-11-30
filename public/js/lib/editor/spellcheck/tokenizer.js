class Stream {
  constructor (text) {
    if (typeof text !== 'string') {
      throw TypeError('text should be string')
    }

    this.text = text
    this.index = -1
    this.length = text.length
  }

  peek () {
    const peekIndex = this.index + 1

    if (peekIndex >= this.length) {
      return null
    } else {
      return this.text[peekIndex]
    }
  }

  next () {
    this.index += 1

    if (this.index >= this.length) {
      return null
    } else {
      return this.text[this.index]
    }
  }
}

/** @typedef {{ word: string, ch: number, lineNumber: number }} Token */
/**
 *
 * @param {string} text
 * @returns {Token[]}
 */
export function tokenizer (text) {
  const lineStreams = text.split('\n').map(l => new Stream(l))
  const regexWord = '!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ '

  const tokens = []

  lineStreams.forEach((stream, lineIndex) => {
    let ch
    let column = 0
    let word = ''

    while ((ch = stream.peek()) != null) {
      if (regexWord.includes(ch)) {
        if (word.length > 0) {
          tokens.push({
            word,
            ch: column - word.length,
            lineNumber: lineIndex
          })
        }
        word = ''
      } else {
        word += ch
      }

      stream.next()
      column += 1
    }
  })

  return tokens
}
