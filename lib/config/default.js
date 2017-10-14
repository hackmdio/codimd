'use strict'

module.exports = {
  domain: '',
  urlpath: '',
  port: 3000,
  urladdport: false,
  alloworigin: ['localhost'],
  usessl: false,
  hsts: {
    enable: true,
    maxAgeSeconds: 31536000,
    includeSubdomains: true,
    preload: true
  },
  protocolusessl: false,
  usecdn: true,
  allowanonymous: true,
  allowfreeurl: false,
  defaultpermission: 'editable',
  dburl: '',
  db: {},
  // ssl path
  sslkeypath: '',
  sslcertpath: '',
  sslcapath: '',
  dhparampath: '',
  // other path
  tmppath: './tmp',
  defaultnotepath: './public/default.md',
  docspath: './public/docs',
  indexpath: './public/views/index.ejs',
  hackmdpath: './public/views/hackmd.ejs',
  errorpath: './public/views/error.ejs',
  prettypath: './public/views/pretty.ejs',
  slidepath: './public/views/slide.ejs',
  // session
  sessionname: 'connect.sid',
  sessionsecret: 'secret',
  sessionlife: 14 * 24 * 60 * 60 * 1000, // 14 days
  staticcachetime: 1 * 24 * 60 * 60 * 1000, // 1 day
  // socket.io
  heartbeatinterval: 5000,
  heartbeattimeout: 10000,
  // document
  documentmaxlength: 100000,
  // image upload setting, available options are imgur/s3/filesystem
  imageUploadType: 'filesystem',
  imgur: {
    clientID: undefined
  },
  s3: {
    accessKeyId: undefined,
    secretAccessKey: undefined,
    region: undefined
  },
  s3bucket: undefined,
  // authentication
  facebook: {
    clientID: undefined,
    clientSecret: undefined
  },
  twitter: {
    consumerKey: undefined,
    consumerSecret: undefined
  },
  github: {
    clientID: undefined,
    clientSecret: undefined
  },
  gitlab: {
    baseURL: undefined,
    clientID: undefined,
    clientSecret: undefined,
    scope: undefined
  },
  dropbox: {
    clientID: undefined,
    clientSecret: undefined
  },
  google: {
    clientID: undefined,
    clientSecret: undefined
  },
  ldap: {
    providerName: undefined,
    url: undefined,
    bindDn: undefined,
    bindCredentials: undefined,
    tokenSecret: undefined,
    searchBase: undefined,
    searchFilter: undefined,
    searchAttributes: undefined,
    tlsca: undefined
  },
  email: true,
  allowemailregister: true
}
