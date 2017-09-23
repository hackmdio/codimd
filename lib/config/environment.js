'use strict'

const {toBooleanConfig} = require('./utils')

module.exports = {
  domain: process.env.HMD_DOMAIN,
  urlpath: process.env.HMD_URL_PATH,
  port: process.env.HMD_PORT,
  urladdport: process.env.HMD_URL_ADDPORT,
  usessl: toBooleanConfig(process.env.HMD_USESSL),
  protocolusessl: toBooleanConfig(process.env.HMD_PROTOCOL_USESSL),
  alloworigin: process.env.HMD_ALLOW_ORIGIN ? process.env.HMD_ALLOW_ORIGIN.split(',') : undefined,
  usecdn: toBooleanConfig(process.env.HMD_USECDN),
  allowanonymous: toBooleanConfig(process.env.HMD_ALLOW_ANONYMOUS),
  allowfreeurl: toBooleanConfig(process.env.HMD_ALLOW_FREEURL),
  defaultpermission: process.env.HMD_DEFAULT_PERMISSION,
  dburl: process.env.HMD_DB_URL,
  imageUploadType: process.env.HMD_IMAGE_UPLOAD_TYPE,
  imgur: {
    clientID: process.env.HMD_IMGUR_CLIENTID
  },
  s3: {
    accessKeyId: process.env.HMD_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.HMD_S3_SECRET_ACCESS_KEY,
    region: process.env.HMD_S3_REGION,
    bucket: process.env.HMD_S3_BUCKET
  },
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
  dropbox: {
    clientID: process.env.HMD_DROPBOX_CLIENTID,
    clientSecret: process.env.HMD_DROPBOX_CLIENTSECRET
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
    tokenSecret: process.env.HMD_LDAP_TOKENSECRET,
    searchBase: process.env.HMD_LDAP_SEARCHBASE,
    searchFilter: process.env.HMD_LDAP_SEARCHFILTER,
    searchAttributes: process.env.HMD_LDAP_SEARCHATTRIBUTES,
    tlsca: process.env.HMD_LDAP_TLS_CA
  },
  email: toBooleanConfig(process.env.HMD_EMAIL),
  allowemailregister: toBooleanConfig(process.env.HMD_ALLOW_EMAIL_REGISTER)
}
