import {Router} from 'express'
import passport from 'passport'

import * as config from '../../config'
import {passportGeneralCallback, setReturnToFromReferer} from '../utils'
import {OAuth2CustomStrategy} from './strategy'

const oauth2Auth = Router()
export = oauth2Auth

passport.use(new OAuth2CustomStrategy({
  authorizationURL: config.oauth2.authorizationURL,
  tokenURL: config.oauth2.tokenURL,
  clientID: config.oauth2.clientID,
  clientSecret: config.oauth2.clientSecret,
  callbackURL: config.serverURL + '/auth/oauth2/callback',
  userProfileURL: config.oauth2.userProfileURL,
  state: config.oauth2.state,
  scope: config.oauth2.scope
}, passportGeneralCallback))

oauth2Auth.get('/auth/oauth2', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('oauth2')(req, res, next)
})

// github auth callback
oauth2Auth.get('/auth/oauth2/callback',
  passport.authenticate('oauth2', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)
