export const DROPBOX_APP_KEY = window.DROPBOX_APP_KEY || ''

export const domain = window.domain || '' // domain name
export const urlpath = window.urlpath || '' // sub url path, like: www.example.com/<urlpath>
export const debug = window.debug || false

export const port = window.location.port
export const serverurl = `${window.location.protocol}//${domain || window.location.hostname}${port ? ':' + port : ''}${urlpath ? '/' + urlpath : ''}`
window.serverurl = serverurl
export const noteid = decodeURIComponent(urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1])
export const noteurl = `${serverurl}/${noteid}`

export const version = window.version
