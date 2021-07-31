import { serverurl } from '../config'

export const availableThemes = [
  { name: 'Light', value: 'default' },
  { name: 'One Dark (Default)', value: 'one-dark' },
  { name: 'Monokai', value: 'monokai' },
  { name: 'Solarized Dark', value: 'solarized dark' },
  { name: 'Solarized Light', value: 'solarized light' },
  { name: 'Dracula', value: 'dracula' },
  { name: 'Material', value: 'material' },
  { name: 'Nord', value: 'nord' },
  { name: 'Panda', value: 'panda-syntax' },
  { name: 'Ayu Dark', value: 'ayu-dark' },
  { name: 'Ayu Mirage', value: 'ayu-mirage' },
  { name: 'Tomorror Night Bright', value: 'tomorrow-night-bright' },
  { name: 'Tomorror Night Eighties', value: 'tomorrow-night-eighties' }
]

export const emojifyImageDir = window.USE_CDN ? 'https://cdn.jsdelivr.net/npm/@hackmd/emojify.js@2.1.0/dist/images/basic' : `${serverurl}/build/emojify.js/dist/images/basic`
