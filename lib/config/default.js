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
  csp: {
    enable: true,
    directives: {
    },
    addDefaults: true,
    upgradeInsecureRequests: 'auto',
    reportURI: undefined
  },
  protocolusessl: false,
  usecdn: true,
  allowanonymous: true,
  allowanonymousedits: false,
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
  imageuploadtype: 'filesystem',
  // legacy variable name for imageuploadtype
  imageUploadType: undefined,
  imgur: {
    clientID: undefined
  },
  s3: {
    accessKeyId: undefined,
    secretAccessKey: undefined,
    region: undefined
  },
  minio: {
    accessKey: undefined,
    secretKey: undefined,
    endPoint: undefined,
    secure: true,
    port: 9000
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
  mattermost: {
    baseURL: undefined,
    clientID: undefined,
    clientSecret: undefined
  },
  dropbox: {
    clientID: undefined,
    clientSecret: undefined,
    appKey: undefined
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
    searchBase: undefined,
    searchFilter: undefined,
    searchAttributes: undefined,
    usernameField: undefined,
    useridField: undefined,
    tlsca: undefined
  },
  saml: {
    idpSsoUrl: undefined,
    idpCert: undefined,
    issuer: undefined,
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    groupAttribute: undefined,
    externalGroups: [],
    requiredGroups: [],
    attribute: {
      id: undefined,
      username: undefined,
      email: undefined
    }
  },
  email: true,
  allowemailregister: true,
  allowpdfexport: true
}
