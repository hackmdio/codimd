'use strict'

module.exports = {
  domain: '',
  urlPath: '',
  port: 3000,
  urlAddPort: false,
  allowOrigin: ['localhost'],
  useSSL: false,
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
    addDisqus: true,
    addGoogleAnalytics: true,
    upgradeInsecureRequests: 'auto',
    reportURI: undefined
  },
  protocolUseSSL: false,
  useCDN: true,
  allowAnonymous: true,
  allowAnonymousEdits: false,
  allowFreeURL: false,
  defaultPermission: 'editable',
  dbURL: '',
  db: {},
  // ssl path
  sslKeyPath: '',
  sslCertPath: '',
  sslCAPath: '',
  dhParamPath: '',
  // other path
  tmpPath: './tmp',
  defaultNotePath: './public/default.md',
  docsPath: './public/docs',
  indexPath: './public/views/index.ejs',
  hackmdPath: './public/views/hackmd.ejs',
  errorPath: './public/views/error.ejs',
  prettyPath: './public/views/pretty.ejs',
  slidePath: './public/views/slide.ejs',
  // session
  sessionName: 'connect.sid',
  sessionSecret: 'secret',
  sessionSecretLen: 128,
  sessionLife: 14 * 24 * 60 * 60 * 1000, // 14 days
  staticCacheTime: 1 * 24 * 60 * 60 * 1000, // 1 day
  // socket.io
  heartbeatInterval: 5000,
  heartbeatTimeout: 10000,
  // document
  documentMaxLength: 100000,
  // image upload setting, available options are imgur/s3/filesystem/azure
  imageUploadType: 'filesystem',
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
  azure: {
    connectionString: undefined,
    container: undefined
  },
  // authentication
  oauth2: {
    authorizationURL: undefined,
    tokenURL: undefined,
    clientID: undefined,
    clientSecret: undefined
  },
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
  allowEmailRegister: true,
  allowPDFExport: true
}
