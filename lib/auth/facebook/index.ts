import {Router} from "express";
import passport from "passport";
import {Strategy as FacebookStrategy} from "passport-facebook";

import * as config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";

const facebookAuth = Router()
export = facebookAuth

passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.serverURL + '/auth/facebook/callback'
}, passportGeneralCallback))

facebookAuth.get('/auth/facebook', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('facebook')(req, res, next)
})

// facebook auth callback
facebookAuth.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
