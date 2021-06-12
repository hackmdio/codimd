import {Router} from "express";
import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";

import * as config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";

const googleAuth = module.exports = Router()

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.serverURL + '/auth/google/callback',
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, passportGeneralCallback))

googleAuth.get('/auth/google', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('google', {
    scope: ['profile'],
    hostedDomain: config.google.hostedDomain
  })(req, res, next)
})
// google auth callback
googleAuth.get('/auth/google/callback',
  passport.authenticate('google', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
