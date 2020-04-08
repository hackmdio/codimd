import './css/i.css'
import dotEmpty from './svg/dotEmpty.svg'
import dotEmpty_h from './svg/dotEmpty_h.svg'
import dot from './svg/dot.svg'
import dot_h from './svg/dot_h.svg'
import dotWideLeft from './svg/dotWideLeft.svg'
import dotWideRight from './svg/dotWideRight.svg'
import dotWideMiddle from './svg/dotWideMiddle.svg'
import string_o from './svg/string_o.svg'
import string_x from './svg/string_x.svg'

const switchList_v = {
  'o': `<div class='cell dot'>${dot}</div>`,
  '*': `<div class='cell dot faded'>${dot}</div>`,
  '(': `<div class='cell'>${dotWideLeft}</div>`,
  ')': `<div class='cell'>${dotWideRight}</div>`,
  '=': `<div class='cell'>${dotWideMiddle}</div>`,
  '^': `<div class='cell'>${string_o}</div>`,
  'x': `<div class='cell'>${string_x}</div>`,
  '|': `<div class='cell empty'>${dotEmpty}</div>`,
  ' ': `<div class='cell empty'>${dotEmpty}</div>`
}
const switchList_h = {
  'o': `<div class='cell dot'>${dot_h}</div>`,
  '*': `<div class='cell dot faded'>${dot_h}</div>`,
  'O': `<div class='cell dot root'>${dot_h}</div>`,
  '-': `<div class='cell empty'>${dotEmpty_h}</div>`,
  ' ': `<div class='cell empty'>${dotEmpty_h}</div>`
}

let getArgument = (argName, content) => {
  let lineOfContent = content.data.split('\n')

  let argv = ''
  let indexOfArg = ''
  let idx = ''
  for (idx in lineOfContent) {
    if (lineOfContent[idx].startsWith(argName)) {
      argv = lineOfContent[idx].split(argName)[1].trim()
      break
    }
  }

  lineOfContent.splice(idx, 1)
  content.data = lineOfContent.join('\n')

  return argv
}

export const renderFretBoard = (data) => {
  let fretboardHTML = $('<div class="fretboard_instance"></div>')

  // parsing arguments
  let content = { 'data': data }
  let getTitle = getArgument('title:', content)
  let fretType = getArgument('type:', content).split(' ')
  content = content.data

  $(fretboardHTML).append($(`<div class="fretTitle">${getTitle}</div>`))

  // create fretboard background HTML
  let fretb_orientation = fretType && fretType[0].startsWith('v') ? 'vert' : 'horiz'
  let fretb_len = fretType && fretType[0].substring(1)
  let fretb_class = fretType && fretType[0][0] + ' ' + fretType[0]
  let nut = (fretType[1] && fretType[1] === 'noNut')?'noNut':''
  let svgHTML = $(`<div class="svg_wrapper ${fretb_class} ${nut}"></div>`)
  let fretb_bg = require(`./svg/fretb_${fretb_orientation}_${fretb_len}.svg`)
  $(svgHTML).append($(fretb_bg))

  // create cells HTML
  let cellsHTML = $('<div class="cells"></div>')
  let switchList = fretb_orientation && fretb_orientation === 'vert' ? switchList_v : switchList_h
  let contentCell = content && content.split('')
  // Go through each ASCII character...
  contentCell && contentCell.forEach(char => {
    if (switchList[char] !== undefined) {
      cellsHTML.append($(switchList[char]));
    }
  })

  $(svgHTML).append($(cellsHTML))
  $(fretboardHTML).append($(svgHTML))

  return fretboardHTML[0].outerHTML
}