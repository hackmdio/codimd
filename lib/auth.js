//auth
//external modules
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var GitlabStrategy = require('passport-gitlab2').Strategy;
var DropboxStrategy = require('passport-dropbox-oauth2').Strategy;

//core
var config = require('./config.js');
var logger = require("./logger.js");
var models = require("./models");

function callback(accessToken, refreshToken, profile, done) {
    //logger.info(profile.displayName || profile.username);
    var stringifiedProfile = JSON.stringify(profile);
    models.User.findOrCreate({
        where: {
            profileid: profile.id.toString()
        },
        defaults: {
            profile: stringifiedProfile,
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    }).spread(function (user, created) {
        if (user) {
            var needSave = false;
            if (user.profile != stringifiedProfile) {
                user.profile = stringifiedProfile;
                needSave = true;
            }
            if (user.accessToken != accessToken) {
                user.accessToken = accessToken;
                needSave = true;
                
            }
            if (user.refreshToken != refreshToken) {
                user.refreshToken = refreshToken;
                needSave = true;
                
            }
            if (needSave) {
                user.save().then(function () {
                    if (config.debug)
                        logger.info('user login: ' + user.id);
                    return done(null, user);
                });
            } else {
                if (config.debug)
                    logger.info('user login: ' + user.id);
                return done(null, user);
            }
        }
    }).catch(function (err) {
        logger.error('auth callback failed: ' + err);
        return done(err, null);
    })
}

//facebook
if (config.facebook) {
    module.exports = passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.serverurl + '/auth/facebook/callback'
    }, callback));
}
//twitter
if (config.twitter) {
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: config.serverurl + '/auth/twitter/callback'
    }, callback));
}
//github
if (config.github) {
    passport.use(new GithubStrategy({
        clientID: config.github.clientID,
        clientSecret: config.github.clientSecret,
        callbackURL: config.serverurl + '/auth/github/callback'
    }, callback));
}
//gitlab
if (config.gitlab) {
    passport.use(new GitlabStrategy({
        baseURL: config.gitlab.baseURL,
        clientID: config.gitlab.clientID,
        clientSecret: config.gitlab.clientSecret,
        callbackURL: config.serverurl + '/auth/gitlab/callback'
    }, callback));
}
//dropbox
if (config.dropbox) {
    passport.use(new DropboxStrategy({
        apiVersion: '2',
        clientID: config.dropbox.clientID,
        clientSecret: config.dropbox.clientSecret,
        callbackURL: config.serverurl + '/auth/dropbox/callback'
    }, callback));
}