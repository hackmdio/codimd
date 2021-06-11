import {Router} from "express";
import * as passport from "passport";

require('babel-polyfill')
require('isomorphic-fetch')
import MattermostClient from "mattermost-redux/client/client4";
import {Strategy as OAuthStrategy} from "passport-oauth2";

import * as config from "../../config";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";


const mattermostAuth = Router()
export = module.exports

const mattermostClient = new MattermostClient()

const mattermostStrategy = new OAuthStrategy({
  authorizationURL: config.mattermost.baseURL + '/oauth/authorize',
  tokenURL: config.mattermost.baseURL + '/oauth/access_token',
  clientID: config.mattermost.clientID,
  clientSecret: config.mattermost.clientSecret,
  callbackURL: config.serverURL + '/auth/mattermost/callback'
}, passportGeneralCallback)

mattermostStrategy.userProfile = (accessToken, done) => {
  mattermostClient.setUrl(config.mattermost.baseURL)
  mattermostClient.setToken(accessToken)
  mattermostClient.getMe()
    .then((data) => done(null, data))
    .catch((err) => done(err))
}

passport.use(mattermostStrategy)

mattermostAuth.get('/auth/mattermost', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('oauth2')(req, res, next)
})

// mattermost auth callback
mattermostAuth.get('/auth/mattermost/callback',
  passport.authenticate('oauth2', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
