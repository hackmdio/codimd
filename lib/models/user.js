'use strict'
// external modules
var Sequelize = require('sequelize')
var scrypt = require('scrypt')

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
      }
    }
  })

  User.prototype.verifyPassword = function (attempt) {
    if (scrypt.verifyKdfSync(Buffer.from(this.password, 'hex'), attempt)) {
      return this
    } else {
      return false
    }
  }

  User.associate = function (models) {
    User.hasMany(models.Note, {
      foreignKey: 'ownerId',
      constraints: false
    })
    User.hasMany(models.Note, {
      foreignKey: 'lastchangeuserId',
      constraints: false
    })
  }
  User.getProfile = function (user) {
    if (!user) {
      return null
    }
    return user.profile ? User.parseProfile(user.profile) : (user.email ? User.parseProfileByEmail(user.email) : null)
  }
  User.parseProfile = function (profile) {
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
  }
  User.parsePhotoByProfile = function (profile, bigger) {
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
        if (profile.photos && profile.photos[0]) photo = profile.photos[0].value.replace('?', '')
        else photo = 'https://avatars.githubusercontent.com/u/' + profile.id
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
  }
  User.parseProfileByEmail = function (email) {
    return {
      name: email.substring(0, email.lastIndexOf('@')),
      photo: generateAvatarURL('', email, false),
      biggerphoto: generateAvatarURL('', email, true)
    }
  }

  return User
}
