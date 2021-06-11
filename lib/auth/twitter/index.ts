import {Router} from "express";
import passport from "passport";
import {Strategy as TwitterStrategy} from "passport-twitter";

import * as config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";

const twitterAuth = Router()
export = module.exports

passport.use(new TwitterStrategy({
  consumerKey: config.twitter.consumerKey,
  consumerSecret: config.twitter.consumerSecret,
  callbackURL: config.serverURL + '/auth/twitter/callback'
}, passportGeneralCallback))

twitterAuth.get('/auth/twitter', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('twitter')(req, res, next)
})

// twitter auth callback
twitterAuth.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
