import {Router} from "express";
import passport from "passport";
import LDAPStrategy from "passport-ldapauth";

import config from "../../config";
import {User} from "../../models";
import {logger} from "../../logger";
import * as response from "../../response";
import {setReturnToFromReferer} from "../utils";
import {urlencodedParser} from "../../utils";

const ldapAuth = Router()
export = ldapAuth

passport.use(new LDAPStrategy({
  server: {
    url: config.ldap.url || null,
    bindDN: config.ldap.bindDn || null,
    bindCredentials: config.ldap.bindCredentials || null,
    searchBase: config.ldap.searchBase || null,
    searchFilter: config.ldap.searchFilter || null,
    searchAttributes: config.ldap.searchAttributes || null,
    tlsOptions: config.ldap.tlsOptions || null
  }
}, function (user, done) {
  let uuid = user.uidNumber || user.uid || user.sAMAccountName || undefined
  if (config.ldap.useridField && user[config.ldap.useridField]) {
    uuid = user[config.ldap.useridField]
  }

  if (typeof uuid === 'undefined') {
    throw new Error('Could not determine UUID for LDAP user. Check that ' +
      'either uidNumber, uid or sAMAccountName is set in your LDAP directory ' +
      'or use another unique attribute and configure it using the ' +
      '"useridField" option in ldap settings.')
  }

  let username = uuid
  if (config.ldap.usernameField && user[config.ldap.usernameField]) {
    username = user[config.ldap.usernameField]
  }

  const profile = {
    id: 'LDAP-' + uuid,
    username: username,
    displayName: user.displayName,
    emails: user.mail ? Array.isArray(user.mail) ? user.mail : [user.mail] : [],
    avatarUrl: null,
    profileUrl: null,
    provider: 'ldap'
  }
  const stringifiedProfile = JSON.stringify(profile)
  User.findOrCreate({
    where: {
      profileid: profile.id.toString()
    },
    defaults: {
      profile: stringifiedProfile
    }
  }).spread(function (user, created) {
    if (user) {
      let needSave = false
      if (user.profile !== stringifiedProfile) {
        user.profile = stringifiedProfile
        needSave = true
      }
      if (needSave) {
        user.save().then(function () {
          if (config.debug) {
            logger.debug('user login: ' + user.id)
          }
          return done(null, user)
        })
      } else {
        if (config.debug) {
          logger.debug('user login: ' + user.id)
        }
        return done(null, user)
      }
    }
  }).catch(function (err) {
    logger.error('ldap auth failed: ' + err)
    return done(err, null)
  })
}))

ldapAuth.post('/auth/ldap', urlencodedParser, function (req, res, next) {
  if (!req.body.username || !req.body.password) return response.errorBadRequest(req, res)
  setReturnToFromReferer(req)
  passport.authenticate('ldapauth', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/',
    failureFlash: true
  })(req, res, next)
})
