import {Router} from "express";
import * as passport from "passport";
import {Strategy as DropboxStrategy} from "passport-dropbox-oauth2";

import * as config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";

const dropboxAuth = Router()
export = dropboxAuth

passport.use(new DropboxStrategy({
  apiVersion: '2',
  clientID: config.dropbox.clientID,
  clientSecret: config.dropbox.clientSecret,
  callbackURL: config.serverURL + '/auth/dropbox/callback'
}, passportGeneralCallback))

dropboxAuth.get('/auth/dropbox', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('dropbox-oauth2')(req, res, next)
})

// dropbox auth callback
dropboxAuth.get('/auth/dropbox/callback',
  passport.authenticate('dropbox-oauth2', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
