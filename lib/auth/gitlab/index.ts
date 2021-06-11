import {Router} from "express";
import * as passport from "passport";
import {Strategy as GitlabStrategy} from "passport-gitlab2";

import * as config from "../../config";
import * as response from "../../response";
import {passportGeneralCallback, setReturnToFromReferer} from "../utils";
import * as HttpsProxyAgent from "https-proxy-agent";

const gitlabAuth = Router()
export = gitlabAuth

const gitlabAuthStrategy = new GitlabStrategy({
  baseURL: config.gitlab.baseURL,
  clientID: config.gitlab.clientID,
  clientSecret: config.gitlab.clientSecret,
  scope: config.gitlab.scope,
  callbackURL: config.serverURL + '/auth/gitlab/callback'
}, passportGeneralCallback)

if (process.env.https_proxy) {
  const httpsProxyAgent = new HttpsProxyAgent(process.env.https_proxy)
  gitlabAuthStrategy._oauth2.setAgent(httpsProxyAgent)
}

passport.use(gitlabAuthStrategy)

gitlabAuth.get('/auth/gitlab', function (req, res, next) {
  setReturnToFromReferer(req)
  passport.authenticate('gitlab')(req, res, next)
})

// gitlab auth callback
gitlabAuth.get('/auth/gitlab/callback',
  passport.authenticate('gitlab', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/'
  })
)

if (!config.gitlab.scope || config.gitlab.scope === 'api') {
  // gitlab callback actions
  gitlabAuth.get('/auth/gitlab/callback/:noteId/:action', response.gitlabActions)
}
