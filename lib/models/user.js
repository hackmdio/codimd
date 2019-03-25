'use strict'
// external modules
var Sequelize = require('sequelize')
var scrypt = require('@mlink/scrypt')

// core
var logger = require('../logger')
var { generateAvatarURL } = require('../letter-avatars')

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    profileid: {
      type: DataTypes.STRING,
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^[a-z0-9\-_.+]+$/i,
        len: [2, 255]
      }
    },
    displayname: {
      type: DataTypes.STRING,
      validate: {
        len: [2, 255]
      }
    },

    profile: {
      type: DataTypes.TEXT
    },
    history: {
      type: DataTypes.TEXT
    },
    accessToken: {
      type: DataTypes.TEXT
    },
    refreshToken: {
      type: DataTypes.TEXT
    },
    deleteToken: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    email: {
      type: Sequelize.TEXT,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.TEXT,
      set: function (value) {
        var hash = scrypt.kdfSync(value, scrypt.paramsSync(0.1)).toString('hex')
        this.setDataValue('password', hash)
        this.setDataValue('password_cleartext', value)
      }
    },
    invalid_password_given: {
      type: Sequelize.VIRTUAL,
      validate: {
        valid: (value) => {
          if (value) throw new Error('invalid old password')
        }
      }
    },
    password_cleartext: {
      type: Sequelize.VIRTUAL
    },
    password_confirmation: {
      type: Sequelize.VIRTUAL
    }
  }, {
    instanceMethods: {
      verifyPassword: function (attempt) {
        if (scrypt.verifyKdfSync(Buffer.from(this.password, 'hex'), attempt)) {
          return this
        } else {
          return false
        }
      }
    },
    classMethods: {
      associate: function (models) {
        User.hasMany(models.Note, {
          foreignKey: 'ownerId',
          constraints: false
        })
        User.hasMany(models.Note, {
          foreignKey: 'lastchangeuserId',
          constraints: false
        })
      },
      getProfile: function (user) {
        if (!user) {
          return null
        }
        return user.profile ? User.parseProfile(user.profile) : (user.email ? User.parseProfileByUser(user) : null)
      },
      parseProfile: function (profile) {
        try {
          profile = JSON.parse(profile)
        } catch (err) {
          logger.error(err)
          profile = null
        }
        if (profile) {
          profile = {
            name: profile.displayName || profile.username,
            photo: User.parsePhotoByProfile(profile),
            biggerphoto: User.parsePhotoByProfile(profile, true)
          }
        }
        return profile
      },
      parsePhotoByProfile: function (profile, bigger) {
        var photo = null
        switch (profile.provider) {
          case 'facebook':
            photo = 'https://graph.facebook.com/' + profile.id + '/picture'
            if (bigger) photo += '?width=400'
            else photo += '?width=96'
            break
          case 'twitter':
            photo = 'https://twitter.com/' + profile.username + '/profile_image'
            if (bigger) photo += '?size=original'
            else photo += '?size=bigger'
            break
          case 'github':
            photo = 'https://avatars.githubusercontent.com/u/' + profile.id
            if (bigger) photo += '?s=400'
            else photo += '?s=96'
            break
          case 'gitlab':
            photo = profile.avatarUrl
            if (photo) {
              if (bigger) photo = photo.replace(/(\?s=)\d*$/i, '$1400')
              else photo = photo.replace(/(\?s=)\d*$/i, '$196')
            } else {
              photo = generateAvatarURL(profile.username)
            }
            break
          case 'mattermost':
            photo = profile.avatarUrl
            if (photo) {
              if (bigger) photo = photo.replace(/(\?s=)\d*$/i, '$1400')
              else photo = photo.replace(/(\?s=)\d*$/i, '$196')
            } else {
              photo = generateAvatarURL(profile.username)
            }
            break
          case 'dropbox':
            photo = generateAvatarURL('', profile.emails[0].value, bigger)
            break
          case 'google':
            photo = profile.photos[0].value
            if (bigger) photo = photo.replace(/(\?sz=)\d*$/i, '$1400')
            else photo = photo.replace(/(\?sz=)\d*$/i, '$196')
            break
          case 'ldap':
            photo = generateAvatarURL(profile.username, profile.emails[0], bigger)
            break
          case 'saml':
            photo = generateAvatarURL(profile.username, profile.emails[0], bigger)
            break
        }
        return photo
      },
      parseProfileByUser: function (user) {
        var email = user.email
        return {
          name: user.name || email.substring(0, email.lastIndexOf('@')),
          photo: generateAvatarURL('', email, false),
          biggerphoto: generateAvatarURL('', email, true)
        }
      }
    },
    validate: {
      confirmation_matches: function () {
        // confirmation is only run for updating existing entries
        if (!this.isNewRecord && (this.password_confirmation || this.password_cleartext) && this.password_confirmation !== this.password_cleartext) {
          throw new Error('password and confirmation do not match')
        }
      }
    }
  })

  return User
}
