import {Router} from "express";
import passport from "passport";
import {Strategy as GithubStrategy} from "passport-github";
import * as config from "../../config";
import * as response from "../../response";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";
import {URL} from "url";

const githubAuth = Router()
export = githubAuth

function githubUrl (path) {
  return config.github.enterpriseURL && new URL(path, config.github.enterpriseURL).toString()
}

passport.use(new GithubStrategy({
  clientID: config.github.clientID,
  clientSecret: config.github.clientSecret,
  callbackURL: config.serverURL + '/auth/github/callback',
  authorizationURL: githubUrl('login/oauth/authorize'),
  tokenURL: githubUrl('login/oauth/access_token'),
  userProfileURL: githubUrl('api/v3/user')
}, passportGeneralCallback))

githubAuth.get('/auth/github', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('github')(req, res, next)
})

// github auth callback
githubAuth.get('/auth/github/callback',
  passport.authenticate('github', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)

// github callback actions
githubAuth.get('/auth/github/callback/:noteId/:action', response.githubActions)
