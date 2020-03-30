import {
  dotEmpty,
  dotEmpty_h,
  dot,
  dot_h,
  dotWideLeft,
  dotWideRight,
  dotWideMiddle,
  string_o,
  string_x,
  fretb_vert_4,
  fretb_vert_5,
  fretb_vert_7,
  fretb_vert_9,
  fretb_vert_12,
  fretb_vert_15,
  fretb_horiz_5,
  fretb_horiz_6,
  fretb_horiz_7,
} from './fretboardSVG.js'

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

export const renderFretBoard = (content) => {

  let fretboardHTML = $('<div class="fretboard_instance"></div>')
  if (content.includes('title:')) {
    const getTitle = content.split('\n', 1)[0].split('title:')[1].trim()
    $(fretboardHTML).append($(`<div class="title">${getTitle}</div>`))
    content = content.split('\n').slice(1).join('\n') 
  }

  let fretType = ''
  if (content.startsWith('type:')) {
    fretType = content.split('\n', 1)[0].split('type:')[1].trim().split(' ')
    content = content.split('\n').slice(1).join('\n') 
  }

  let fretb_orientation = fretType[0].startsWith('v') ? 'vert' : 'horiz'
  let fretb_len = fretType[0].substring(1)

  // TODO: to get svg dynamically
  let fretb_bg = ''
  switch (fretb_len) {
    case '4':
      fretb_bg = fretb_vert_4
      break
    case '5':
      if (fretb_orientation === 'vert')
        fretb_bg = fretb_vert_5
      else
        fretb_bg = fretb_horiz_5
      break
    case '6':
      fretb_bg = fretb_horiz_6
      break
    case '7':
      if (fretb_orientation === 'vert')
        fretb_bg = fretb_vert_7
      else
        fretb_bg = fretb_horiz_7
      break
    case '9':
      fretb_bg = fretb_vert_9
      break
    case '12':
      fretb_bg = fretb_vert_12
      break
    case '15':
      fretb_bg = fretb_vert_15
      break
  }

  // create fretboard background HTML
  let fretb_class = fretType[0][0] + ' ' + fretType[0]
  let nut = (fretType[1] && fretType[1] === 'noNut')?'noNut':''
  let svgHTML = $(`<div class="svg_wrapper ${fretb_class} ${nut}"></div>`)
  $(svgHTML).append($(fretb_bg))

  // create cells HTML
  let cellsHTML = $('<div class="cells"></div>')
  let switchList = fretb_orientation === 'vert' ? switchList_v : switchList_h
  let contentCell = content.split('')
  // Go through each ASCII character...
  contentCell.forEach(char => {
    if (switchList[char] !== undefined) {
      cellsHTML.append($(switchList[char]));
    }
  })

  $(svgHTML).append($(cellsHTML))
  $(fretboardHTML).append($(svgHTML))

  return fretboardHTML[0].outerHTML
}