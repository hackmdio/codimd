export const GOOGLE_API_KEY = window.GOOGLE_API_KEY || ''
export const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || ''
export const DROPBOX_APP_KEY = window.DROPBOX_APP_KEY || ''

export const domain = window.domain || '' // domain name
export const urlpath = window.urlpath || '' // sub url path, like: www.example.com/<urlpath>
export const debug = window.debug || false

export const port = (function (domain) {
  var found = domain.match(/:(\d+$)/)
  if (found && found[1] === window.location.port) { // there are port in domain.
    return ''
  } else {
    return window.location.port
  }
}(domain || window.location.hostname))
export const serverurl = `${window.location.protocol}//${domain || window.location.hostname}${port ? ':' + port : ''}${urlpath ? '/' + urlpath : ''}`
window.serverurl = serverurl
export const noteid = urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1]
export const noteurl = `${serverurl}/${noteid}`

export const version = window.version
