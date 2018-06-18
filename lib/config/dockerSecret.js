'use strict'

const fs = require('fs')
const path = require('path')

const basePath = path.resolve('/var/run/secrets/')

function getSecret (secret) {
  const filePath = path.join(basePath, secret)
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath)
  return undefined
}

if (fs.existsSync(basePath)) {
  module.exports = {
    sessionsecret: getSecret('sessionsecret'),
    sslkeypath: getSecret('sslkeypath'),
    sslcertpath: getSecret('sslcertpath'),
    sslcapath: getSecret('sslcapath'),
    dhparampath: getSecret('dhparampath'),
    s3: {
      accessKeyId: getSecret('s3_acccessKeyId'),
      secretAccessKey: getSecret('s3_secretAccessKey')
    },
    azure: {
      connectionString: getSecret('azure_connectionString')
    },
    facebook: {
      clientID: getSecret('facebook_clientID'),
      clientSecret: getSecret('facebook_clientSecret')
    },
    twitter: {
      consumerKey: getSecret('twitter_consumerKey'),
      consumerSecret: getSecret('twitter_consumerSecret')
    },
    github: {
      clientID: getSecret('github_clientID'),
      clientSecret: getSecret('github_clientSecret')
    },
    gitlab: {
      clientID: getSecret('gitlab_clientID'),
      clientSecret: getSecret('gitlab_clientSecret')
    },
    mattermost: {
      clientID: getSecret('mattermost_clientID'),
      clientSecret: getSecret('mattermost_clientSecret')
    },
    dropbox: {
      clientID: getSecret('dropbox_clientID'),
      clientSecret: getSecret('dropbox_clientSecret'),
      appKey: getSecret('dropbox_appKey')
    },
    google: {
      clientID: getSecret('google_clientID'),
      clientSecret: getSecret('google_clientSecret')
    },
    imgur: getSecret('imgur_clientid')
  }
}
