'use strict'
// external modules
var md5 = require('blueimp-md5')
var Sequelize = require('sequelize')
var scrypt = require('scrypt')

// core
var logger = require('../logger')
var letterAvatars = require('../letter-avatars')

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
      type: DataTypes.STRING
    },
    refreshToken: {
      type: DataTypes.STRING
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
  }, {
    instanceMethods: {
      verifyPassword: function (attempt) {
        if (scrypt.verifyKdfSync(new Buffer(this.password, 'hex'), attempt)) {
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
        return user.profile ? User.parseProfile(user.profile) : (user.email ? User.parseProfileByEmail(user.email) : null)
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
              photo = letterAvatars(profile.username)
            }
            break
          case 'mattermost':
            photo = profile.avatarUrl
            if (photo) {
              if (bigger) photo = photo.replace(/(\?s=)\d*$/i, '$1400')
              else photo = photo.replace(/(\?s=)\d*$/i, '$196')
            } else {
              photo = letterAvatars(profile.username)
            }
            break
          case 'dropbox':
            // no image api provided, use gravatar
            photo = 'https://www.gravatar.com/avatar/' + md5(profile.emails[0].value)
            if (bigger) photo += '?s=400'
            else photo += '?s=96'
            break
          case 'google':
            photo = profile.photos[0].value
            if (bigger) photo = photo.replace(/(\?sz=)\d*$/i, '$1400')
            else photo = photo.replace(/(\?sz=)\d*$/i, '$196')
            break
          case 'ldap':
            // no image api provided,
            // use gravatar if email exists,
            // otherwise generate a letter avatar
            if (profile.emails[0]) {
              photo = 'https://www.gravatar.com/avatar/' + md5(profile.emails[0])
              if (bigger) photo += '?s=400'
              else photo += '?s=96'
            } else {
              photo = letterAvatars(profile.username)
            }
            break
        }
        return photo
      },
      parseProfileByEmail: function (email) {
        if (email.toLocaleLowerCase().indexOf('@qq.com') > 0) {
          let photoUrl = 'http://q1.qlogo.cn/g?b=qq&nk=' + email.substring(0, email.lastIndexOf('@'))
          return {
            name: email.substring(0, email.lastIndexOf('@')),
            photo: photoUrl + '&s=100',
            biggerphoto: photoUrl + '&s=640'
          }
        } else {
          var photoUrl = 'https://www.gravatar.com/avatar/' + md5(email)
          return {
            name: email.substring(0, email.lastIndexOf('@')),
            photo: photoUrl + '?s=96',
            biggerphoto: photoUrl + '?s=400'
          }
        }
      }
    }
  })

  return User
}
