'use strict'

const {toBooleanConfig, toArrayConfig} = require('./utils')

module.exports = {
  domain: process.env.HMD_DOMAIN,
  urlpath: process.env.HMD_URL_PATH,
  port: process.env.HMD_PORT,
  urladdport: toBooleanConfig(process.env.HMD_URL_ADDPORT),
  usessl: toBooleanConfig(process.env.HMD_USESSL),
  hsts: {
    enable: toBooleanConfig(process.env.HMD_HSTS_ENABLE),
    maxAgeSeconds: process.env.HMD_HSTS_MAX_AGE,
    includeSubdomains: toBooleanConfig(process.env.HMD_HSTS_INCLUDE_SUBDOMAINS),
    preload: toBooleanConfig(process.env.HMD_HSTS_PRELOAD)
  },
  csp: {
    enable: toBooleanConfig(process.env.HMD_CSP_ENABLE),
    reportURI: process.env.HMD_CSP_REPORTURI
  },
  protocolusessl: toBooleanConfig(process.env.HMD_PROTOCOL_USESSL),
  alloworigin: toArrayConfig(process.env.HMD_ALLOW_ORIGIN),
  usecdn: toBooleanConfig(process.env.HMD_USECDN),
  allowanonymous: toBooleanConfig(process.env.HMD_ALLOW_ANONYMOUS),
  allowanonymousedits: toBooleanConfig(process.env.HMD_ALLOW_ANONYMOUS_EDITS),
  allowfreeurl: toBooleanConfig(process.env.HMD_ALLOW_FREEURL),
  defaultpermission: process.env.HMD_DEFAULT_PERMISSION,
  dburl: process.env.HMD_DB_URL,
  imageuploadtype: process.env.HMD_IMAGE_UPLOAD_TYPE,
  imgur: {
    clientID: process.env.HMD_IMGUR_CLIENTID
  },
  s3: {
    accessKeyId: process.env.HMD_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.HMD_S3_SECRET_ACCESS_KEY,
    region: process.env.HMD_S3_REGION
  },
  minio: {
    accessKey: process.env.HMD_MINIO_ACCESS_KEY,
    secretKey: process.env.HMD_MINIO_SECRET_KEY,
    endPoint: process.env.HMD_MINIO_ENDPOINT,
    secure: toBooleanConfig(process.env.HMD_MINIO_SECURE),
    port: (process.env.HMD_MINIO_PORT == undefined) ? undefined : parseInt(process.env.HMD_MINIO_PORT)
  },
  s3bucket: process.env.HMD_S3_BUCKET,
  facebook: {
    clientID: process.env.HMD_FACEBOOK_CLIENTID,
    clientSecret: process.env.HMD_FACEBOOK_CLIENTSECRET
  },
  twitter: {
    consumerKey: process.env.HMD_TWITTER_CONSUMERKEY,
    consumerSecret: process.env.HMD_TWITTER_CONSUMERSECRET
  },
  github: {
    clientID: process.env.HMD_GITHUB_CLIENTID,
    clientSecret: process.env.HMD_GITHUB_CLIENTSECRET
  },
  gitlab: {
    baseURL: process.env.HMD_GITLAB_BASEURL,
    clientID: process.env.HMD_GITLAB_CLIENTID,
    clientSecret: process.env.HMD_GITLAB_CLIENTSECRET,
    scope: process.env.HMD_GITLAB_SCOPE
  },
  mattermost: {
    baseURL: process.env.HMD_MATTERMOST_BASEURL,
    clientID: process.env.HMD_MATTERMOST_CLIENTID,
    clientSecret: process.env.HMD_MATTERMOST_CLIENTSECRET
  },
  dropbox: {
    clientID: process.env.HMD_DROPBOX_CLIENTID,
    clientSecret: process.env.HMD_DROPBOX_CLIENTSECRET,
    appKey: process.env.HMD_DROPBOX_APPKEY
  },
  google: {
    clientID: process.env.HMD_GOOGLE_CLIENTID,
    clientSecret: process.env.HMD_GOOGLE_CLIENTSECRET
  },
  ldap: {
    providerName: process.env.HMD_LDAP_PROVIDERNAME,
    url: process.env.HMD_LDAP_URL,
    bindDn: process.env.HMD_LDAP_BINDDN,
    bindCredentials: process.env.HMD_LDAP_BINDCREDENTIALS,
    searchBase: process.env.HMD_LDAP_SEARCHBASE,
    searchFilter: process.env.HMD_LDAP_SEARCHFILTER,
    searchAttributes: toArrayConfig(process.env.HMD_LDAP_SEARCHATTRIBUTES),
    usernameField: process.env.HMD_LDAP_USERNAMEFIELD,
    useridField: process.env.HMD_LDAP_USERIDFIELD,
    tlsca: process.env.HMD_LDAP_TLS_CA
  },
  saml: {
    idpSsoUrl: process.env.HMD_SAML_IDPSSOURL,
    idpCert: process.env.HMD_SAML_IDPCERT,
    issuer: process.env.HMD_SAML_ISSUER,
    identifierFormat: process.env.HMD_SAML_IDENTIFIERFORMAT,
    groupAttribute: process.env.HMD_SAML_GROUPATTRIBUTE,
    externalGroups: toArrayConfig(process.env.HMD_SAML_EXTERNALGROUPS, '|', []),
    requiredGroups: toArrayConfig(process.env.HMD_SAML_REQUIREDGROUPS, '|', []),
    attribute: {
      id: process.env.HMD_SAML_ATTRIBUTE_ID,
      username: process.env.HMD_SAML_ATTRIBUTE_USERNAME,
      email: process.env.HMD_SAML_ATTRIBUTE_EMAIL
    }
  },
  email: toBooleanConfig(process.env.HMD_EMAIL),
  allowemailregister: toBooleanConfig(process.env.HMD_ALLOW_EMAIL_REGISTER),
  allowpdfexport: toBooleanConfig(process.env.HMD_ALLOW_PDF_EXPORT)
}
