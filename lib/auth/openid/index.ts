import {Router} from "express";
import passport from "passport";
import {Strategy as OpenIDStrategy} from "@passport-next/passport-openid";

import config from "../../config";
import {User} from "../../models";
import {logger} from "../../logger";
import {urlencodedParser} from "../../utils";
import {setReturnToFromReferer} from "../utils";


const openIDAuth = module.exports = Router()

passport.use(new OpenIDStrategy({
  returnURL: config.serverURL + '/auth/openid/callback',
  realm: config.serverURL,
  profile: true
}, function (openid, profile, done) {
  const stringifiedProfile = JSON.stringify(profile)
  User.findOrCreate({
    where: {
      profileid: openid
    },
    defaults: {
      profile: stringifiedProfile
    }
  }).spread(function (user) {
    if (user) {
      let needSave = false
      if (user.profile !== stringifiedProfile) {
        user.profile = stringifiedProfile
        needSave = true
      }
      if (needSave) {
        user.save().then(function () {
          if (config.debug) {
            logger.info('user login: ' + user.id)
          }
          return done(null, user)
        })
      } else {
        if (config.debug) {
          logger.info('user login: ' + user.id)
        }
        return done(null, user)
      }
    }
  }).catch(function (err) {
    logger.error('auth callback failed: ' + err)
    return done(err, null)
  })
}))

openIDAuth.post('/auth/openid', urlencodedParser, function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('openid')(req, res, next)
})

// openID auth callback
openIDAuth.get('/auth/openid/callback',
  passport.authenticate('openid', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
