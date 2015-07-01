//auth
//external modules
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var DropboxStrategy = require('passport-dropbox-oauth2').Strategy;

//core
var User = require('./user.js');
var config = require('../config.js');
var logger = require("./logger.js");

function callback(accessToken, refreshToken, profile, done) {
    //logger.info(profile.displayName || profile.username);
    User.findOrNewUser(profile.id, profile, function (err, user) {
        if (err || user == null) {
            logger.error('auth callback failed: ' + err);
        } else {
            if (config.debug && user)
                logger.info('user login: ' + user._id);
            done(null, user);
        }
    });
}

//facebook
module.exports = passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.getserverurl() + config.facebook.callbackPath
}, callback));
//twitter
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.getserverurl() + config.twitter.callbackPath
}, callback));
//github
passport.use(new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.getserverurl() + config.github.callbackPath
}, callback));
//dropbox
passport.use(new DropboxStrategy({
    clientID: config.dropbox.clientID,
    clientSecret: config.dropbox.clientSecret,
    callbackURL: config.getserverurl() + config.dropbox.callbackPath
}, callback));