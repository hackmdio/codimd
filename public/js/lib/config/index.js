import configJson from '../../../../config.json'; // root path json config

const config = 'production' === process.env.NODE_ENV ? configJson.production : configJson.development;

export const GOOGLE_API_KEY = (config.google && config.google.apiKey) || '';
export const GOOGLE_CLIENT_ID = (config.google && config.google.clientID) || '';
export const DROPBOX_APP_KEY = (config.dropbox && config.dropbox.appKey) || '';

export const domain = config.domain || ''; // domain name
export const urlpath = config.urlpath || ''; // sub url path, like: www.example.com/<urlpath>
export const debug = config.debug || false;

export const port = window.location.port;
export const serverurl = `${window.location.protocol}//${domain ? domain : window.location.hostname}${port ? ':' + port : ''}${urlpath ? '/' + urlpath : ''}`;
window.serverurl = serverurl;
export const noteid = urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1];
export const noteurl = `${serverurl}/${noteid}`;

export const version = '0.5.0';
