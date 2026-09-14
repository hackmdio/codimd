/* global Cookies */
import store from 'store'

// the night mode setting is shared between the cover page and the editor page
export function getNightMode () {
  return store.get('nightMode') === true || Cookies.get('nightMode') === 'true'
}

export function setNightMode (enable) {
  if (store.enabled) {
    store.set('nightMode', enable)
  } else {
    Cookies.set('nightMode', enable, {
      expires: 365
    })
  }
}
