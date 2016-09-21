"use strict";

// external modules
var md5 = require("blueimp-md5");
var Sequelize = require("sequelize");

// core
var logger = require("../logger.js");

module.exports = function (sequelize, DataTypes) {
    var User = sequelize.define("User", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4
        },
        profileid: {
            type: DataTypes.STRING,
            unique: true
        },
        profile: {
            type: DataTypes.TEXT
        },
        history: {
            type: DataTypes.TEXT
        },
        accessToken: {
            type: DataTypes.STRING
        },
        refreshToken: {
            type: DataTypes.STRING
        },
        shortname: {
            type: DataTypes.STRING
        },
    }, {
        classMethods: {
            associate: function (models) {
                User.hasMany(models.Note, {
                    foreignKey: "ownerId",
                    constraints: false
                });
                User.hasMany(models.Note, {
                    foreignKey: "lastchangeuserId",
                    constraints: false
                });
            },
            parseProfile: function (profile) {
                try {
                    var profile = JSON.parse(profile);
                } catch (err) {
                    logger.error(err);
                    profile = null;
                }
                if (profile) {
                    profile = {
                        name: profile.displayName || profile.username,
                        photo: User.parsePhotoByProfile(profile)
                    }
                }
                return profile;
            },
            parsePhotoByProfile: function (profile) {
                var photo = null;
                switch (profile.provider) {
                    case "facebook":
                        photo = 'https://graph.facebook.com/' + profile.id + '/picture?width=96';
                        break;
                    case "twitter":
                        photo = 'https://twitter.com/' + profile.username + '/profile_image?size=bigger';
                        break;
                    case "github":
                        photo = 'https://avatars.githubusercontent.com/u/' + profile.id + '?s=96';
                        break;
                    case "gitlab":
                        photo = profile.avatarUrl.replace(/(\?s=)\d*$/i, '$196');
                        break;
                    case "dropbox":
                        //no image api provided, use gravatar
                        photo = 'https://www.gravatar.com/avatar/' + md5(profile.emails[0].value) + '?s=96';
                        break;
                    case "google":
                        photo = profile.photos[0].value.replace(/(\?sz=)\d*$/i, '$196');
                        break;
                }
                return photo;
            }
        }
    });

    return User;
};
