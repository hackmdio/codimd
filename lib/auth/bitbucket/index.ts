import {Router} from "express";
import passport from "passport";
import {Strategy as BitbucketStrategy} from "passport-bitbucket-oauth2";

import config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";

const bitbucketAuth = Router()
export = bitbucketAuth

passport.use(new BitbucketStrategy({
  clientID: config.bitbucket.clientID,
  clientSecret: config.bitbucket.clientSecret,
  callbackURL: config.serverURL + '/auth/bitbucket/callback'
}, passportGeneralCallback))

bitbucketAuth.get('/auth/bitbucket', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('bitbucket')(req, res, next)
})

// bitbucket auth callback
bitbucketAuth.get('/auth/bitbucket/callback',
  passport.authenticate('bitbucket', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
