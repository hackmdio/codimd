import {Router} from "express";
import passport from "passport";
import validator from "validator";
import {Strategy as LocalStrategy} from 'passport-local';

import config from '../../config';
import {User} from '../../models';
import {logger} from "../../logger";
import {setReturnToFromReferer} from "../utils";
import {urlencodedParser} from "../../utils";
import * as response from "../../response";

const emailAuth = Router()
export = emailAuth

passport.use(new LocalStrategy({
  usernameField: 'email'
}, async function (email, password, done) {
  if (!validator.isEmail(email)) return done(null, false)

  try {
    const user = await User.findOne({
      where: {
        email: email
      }
    })

    if (!user) return done(null, false)
    if (!await user.verifyPassword(password)) return done(null, false)
    return done(null, user)
  } catch (err) {
    logger.error(err)
    return done(err)
  }
}))

if (config.allowEmailRegister) {
  emailAuth.post('/register', urlencodedParser, async function (req, res) {
    if (!req.body.email || !req.body.password) return response.errorBadRequest(req, res)
    if (!validator.isEmail(req.body.email)) return response.errorBadRequest(req, res)
    try {
      const [user, created] = await User.findOrCreate({
        where: {
          email: req.body.email
        },
        defaults: {
          password: req.body.password
        }
      })

      if (!user) {
        req.flash('error', 'Failed to register your account, please try again.')
        return res.redirect(config.serverURL + '/')
      }

      if (created) {
        logger.debug('user registered: ' + user.id)
        req.flash('info', "You've successfully registered, please signin.")
      } else {
        logger.debug('user found: ' + user.id)
        req.flash('error', 'This email has been used, please try another one.')
      }
      return res.redirect(config.serverURL + '/')
    } catch (err) {
      logger.error('auth callback failed: ' + err)
      return response.errorInternalError(req, res)
    }
  })
}

emailAuth.post('/login', urlencodedParser, function (req, res, next) {
  if (!req.body.email || !req.body.password) return response.errorBadRequest(req, res)
  if (!validator.isEmail(req.body.email)) return response.errorBadRequest(req, res)
  setReturnToFromReferer(req)
  passport.authenticate('local', {
    successReturnToOrRedirect: config.serverURL + '/',
    failureRedirect: config.serverURL + '/',
    failureFlash: 'Invalid email or password.'
  })(req, res, next)
})
