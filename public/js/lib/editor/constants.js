import { serverurl } from '../config'

// `light` marks the themes that are readable on a white background, so the
// editor can fall back to a matching one when the light/night mode changes
export const availableThemes = [
  { name: 'Light', value: 'default', light: true },
  { name: 'One Dark', value: 'one-dark' },
  { name: 'Monokai', value: 'monokai' },
  { name: 'Solarized Dark', value: 'solarized dark' },
  { name: 'Solarized Light', value: 'solarized light', light: true },
  { name: 'Dracula', value: 'dracula' },
  { name: 'Material', value: 'material' },
  { name: 'Nord', value: 'nord' },
  { name: 'Panda', value: 'panda-syntax' },
  { name: 'Ayu Dark', value: 'ayu-dark' },
  { name: 'Ayu Mirage', value: 'ayu-mirage' },
  { name: 'Tomorror Night Bright', value: 'tomorrow-night-bright' },
  { name: 'Tomorror Night Eighties', value: 'tomorrow-night-eighties' }
]

export const defaultLightTheme = 'default'
export const defaultNightTheme = 'one-dark'

export const emojifyImageDir = window.USE_CDN ? 'https://cdn.jsdelivr.net/npm/@hackmd/emojify.js@2.1.0/dist/images/basic' : `${serverurl}/build/emojify.js/dist/images/basic`
