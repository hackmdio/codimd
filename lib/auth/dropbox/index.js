'use strict'

const Router = require('express').Router
const passport = require('passport')
const DropboxStrategy = require('passport-dropbox-oauth2').Strategy
const config = require('../../config')
const { setReturnToFromReferer, passportGeneralCallback } = require('../utils')

const dropboxAuth = module.exports = Router()

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
