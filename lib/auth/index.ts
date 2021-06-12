import {Router} from "express";

import passport from "passport";
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isFacebookEnable) authRouter.use(require('./facebook'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isTwitterEnable) authRouter.use(require('./twitter'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isGitHubEnable) authRouter.use(require('./github'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isBitbucketEnable) authRouter.use(require('./bitbucket'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isGitLabEnable) authRouter.use(require('./gitlab'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isMattermostEnable) authRouter.use(require('./mattermost'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isDropboxEnable) authRouter.use(require('./dropbox'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isGoogleEnable) authRouter.use(require('./google'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isLDAPEnable) authRouter.use(require('./ldap'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isSAMLEnable) authRouter.use(require('./saml'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isOAuth2Enable) authRouter.use(require('./oauth2'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isEmailEnable) authRouter.use(require('./email'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (config.isOpenIDEnable) authRouter.use(require('./openid'))

// logout
authRouter.get('/logout', function (req, res) {
  if (config.debug && req.isAuthenticated()) {
    logger.debug('user logout: ' + (req.user as any).id)
  }
  req.logout()
  res.redirect(config.serverURL + '/')
})
