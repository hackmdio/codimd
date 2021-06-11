import {Router} from "express";

import * as passport from "passport";
import * as config from "../config";
import * as logger from "../logger";
import * as models from "../models";

const authRouter = Router()
export = authRouter

// serialize and deserialize
passport.serializeUser(function (user: any, done) {
  logger.info('serializeUser: ' + user.id)
  return done(null, user.id)
})

passport.deserializeUser(function (id, done) {
  models.User.findOne({
    where: {
      id: id
    }
  }).then(function (user) {
    // Don't die on non-existent user
    if (user == null) {
      // @ts-ignore
      return done(null, false, {message: 'Invalid UserID'})
    }

    logger.info('deserializeUser: ' + user.id)
    return done(null, user)
  }).catch(function (err) {
    logger.error(err)
    return done(err, null)
  })
})

if (config.isFacebookEnable) authRouter.use(require('./facebook'))
if (config.isTwitterEnable) authRouter.use(require('./twitter'))
if (config.isGitHubEnable) authRouter.use(require('./github'))
if (config.isBitbucketEnable) authRouter.use(require('./bitbucket'))
if (config.isGitLabEnable) authRouter.use(require('./gitlab'))
if (config.isMattermostEnable) authRouter.use(require('./mattermost'))
if (config.isDropboxEnable) authRouter.use(require('./dropbox'))
if (config.isGoogleEnable) authRouter.use(require('./google'))
if (config.isLDAPEnable) authRouter.use(require('./ldap'))
if (config.isSAMLEnable) authRouter.use(require('./saml'))
if (config.isOAuth2Enable) authRouter.use(require('./oauth2'))
if (config.isEmailEnable) authRouter.use(require('./email'))
if (config.isOpenIDEnable) authRouter.use(require('./openid'))

// logout
authRouter.get('/logout', function (req, res) {
  if (config.debug && req.isAuthenticated()) {
    logger.debug('user logout: ' + (req.user as any).id)
  }
  req.logout()
  res.redirect(config.serverURL + '/')
})
