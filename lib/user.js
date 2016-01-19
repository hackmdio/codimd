//user
//external modules
var mongoose = require('mongoose');
var md5 = require("md5");

//core
var config = require("../config.js");
var logger = require("./logger.js");

// create a user model
var model = mongoose.model('user', {
    id: String,
    profile: String,
    history: String,
    created: Date
});

//public
var user = {
    model: model,
    findUser: findUser,
    newUser: newUser,
    findOrNewUser: findOrNewUser,
    getUserCount: getUserCount,
    parsePhotoByProfile: parsePhotoByProfile
};

function parsePhotoByProfile(profile) {
    var photo = null;
    switch (profile.provider) {
        case "facebook":
            photo = 'https://graph.facebook.com/' + profile.id + '/picture';
            break;
        case "twitter":
            photo = profile.photos[0].value;
            break;
        case "github":
            photo = 'https://avatars.githubusercontent.com/u/' + profile.id + '?s=48';
            break;
        case "dropbox":
            //no image api provided, use gravatar
            photo = 'https://www.gravatar.com/avatar/' + md5(profile.emails[0].value);
            break;
    }
    return photo;
}

function getUserCount(callback) {
    model.count(function(err, count){
        if(err) callback(err, null);
        else callback(null, count);
    });
}

function findUser(id, callback) {
    var rule = {};
    var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    if (checkForHexRegExp.test(id))
        rule._id = id;
    else
        rule.id = id;
    model.findOne(rule, function (err, user) {
        if (err) {
            logger.error('find user failed: ' + err);
            callback(err, null);
        }
        if (!err && user) {
            callback(null, user);
        } else {
            logger.error('find user failed: ' + err);
            callback(err, null);
        };
    });
}

function newUser(id, profile, callback) {
    var user = new model({
        id: id,
        profile: JSON.stringify(profile),
        created: Date.now()
    });
    user.save(function (err) {
        if (err) {
            logger.error('new user failed: ' + err);
            callback(err, null);
        } else {
            logger.info("new user success: " + user.id);
            callback(null, user);
        };
    });
}

function findOrNewUser(id, profile, callback) {
    findUser(id, function(err, user) {
        if(err || !user) {
            newUser(id, profile, function(err, user) {
                if(err) {
                    logger.error('find or new user failed: ' + err);
                    callback(err, null);
                } else {
                    callback(null, user);
                }
            });
        } else {
            callback(null, user);
        }
    });
}

module.exports = user;