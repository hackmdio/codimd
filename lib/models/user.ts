import {Sequelize, Model, DataTypes} from "sequelize";
import Scrypt from "scrypt-kdf";

import {logger} from "../logger";
import {generateAvatarURL} from "../letter-avatars";
import {BaseProfile, DropboxProfile, GenericProfile, UserAttributes, UserProfile} from "./baseModel";

export class User extends Model<UserAttributes> implements UserAttributes {
  accessToken: string;
  deleteToken: string;
  email: string;
  history: string;
  id: string;
  password: string;
  profile: string;
  profileid: string;
  refreshToken: string;

  static initialize(sequelize: Sequelize): void {
    User.init({
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
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
        defaultValue: DataTypes.UUIDV4
      },
      email: {
        type: DataTypes.TEXT,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.TEXT
      }
    }, {sequelize})

    User.addHook('beforeCreate', async function (user: User) {
      // only do hash when password is presented
      if (user.password) {
        user.password = await User.hashPassword(user.password)
      }
    })

    User.addHook('beforeUpdate', async function (user: User) {
      if (user.changed('password')) {
        user.password = await User.hashPassword(user.password)
      }
    })
  }

  static associate(models: any): void {
    User.hasMany(models.Note, {
      foreignKey: 'ownerId',
      constraints: false
    })
    User.hasMany(models.Note, {
      foreignKey: 'lastchangeuserId',
      constraints: false
    })
  }

  static async hashPassword(plain): Promise<string> {
    return (await Scrypt.kdf(plain, await Scrypt.pickParams(0.1))).toString('hex')
  }

  async verifyPassword(attempt: string): Promise<false | User> {
    if (await Scrypt.verify(Buffer.from(this.password, 'hex'), attempt)) {
      return this
    }
    return false
  }

  static getProfile(user): UserProfile | null {
    if (!user) return null
    if (user.profile) return User.parseProfile(user.profile)
    if (user.email) return User.parseProfileByEmail(user.email)
    return null
  }

  static parseProfile(profile: string): UserProfile | null {
    let parsedProfile: GenericProfile | null
    try {
      parsedProfile = JSON.parse(profile)
    } catch (err) {
      logger.error(err)
      return null
    }
    let returnProfile: UserProfile | null = null
    if (parsedProfile) {
      returnProfile = {
        name: parsedProfile.displayName || parsedProfile.username,
        photo: User.parsePhotoByProfile(parsedProfile),
        biggerphoto: User.parsePhotoByProfile(parsedProfile, true)
      }
    }
    return returnProfile
  }

  static parsePhotoByProfile(profile: BaseProfile, bigger = false): string {
    let photo = null
    switch ((profile as GenericProfile).provider) {
      case 'facebook': {
        let photo = 'https://graph.facebook.com/' + (profile as GenericProfile).id + '/picture'
        if (bigger) photo += '?width=400'
        else photo += '?width=96'
        return photo
      }
      case 'twitter': {
        photo = 'https://twitter.com/' + (profile as GenericProfile).username + '/profile_image'
        if (bigger) photo += '?size=original'
        else photo += '?size=bigger'
        return photo
      }
      case 'github': {
        const githubProfile = profile as GenericProfile
        const photoURL = new URL(
          githubProfile.photos && githubProfile.photos[0] ?
            githubProfile.photos[0].value
            : `https://avatars.githubusercontent.com/u/${githubProfile.id}`)
        photoURL.searchParams.set('s', (bigger ? 400 : 96).toString())
        return photoURL.toString()
      }
      case 'gitlab': {
        const gitlabProfile = profile as GenericProfile
        let photo = gitlabProfile.avatarUrl
        if (photo) {
          if (bigger) photo = photo.replace(/(\?s=)\d*$/i, '$1400')
          else photo = photo.replace(/(\?s=)\d*$/i, '$196')
        } else {
          photo = generateAvatarURL(gitlabProfile.username)
        }
        return photo
      }
      case 'mattermost': {
        const mattermostProfile = profile as GenericProfile
        let photo = mattermostProfile.avatarUrl
        if (photo) {
          if (bigger) photo = photo.replace(/(\?s=)\d*$/i, '$1400')
          else photo = photo.replace(/(\?s=)\d*$/i, '$196')
        } else {
          photo = generateAvatarURL(mattermostProfile.username)
        }
        return photo
      }
      case 'dropbox': {
        return generateAvatarURL('', (profile as DropboxProfile).emails[0].value, bigger)
      }
      case 'google': {
        const googleProfile = profile as GenericProfile
        const photo = googleProfile.photos[0].value
        if (bigger) return photo.replace(/(\?sz=)\d*$/i, '$1400')
        else return photo.replace(/(\?sz=)\d*$/i, '$196')
      }
      case 'ldap': {
        const ldapProfile = profile as GenericProfile
        return generateAvatarURL(ldapProfile.username, ldapProfile.emails[0], bigger)
      }
      case 'saml': {
        const samlProfile = profile as GenericProfile
        return generateAvatarURL(samlProfile.username, samlProfile.emails[0], bigger)
      }
      case 'oauth2': {
        const oauth2Profile = profile as GenericProfile
        let photo = oauth2Profile.photo
        if (!photo) photo = generateAvatarURL(oauth2Profile.username, oauth2Profile.email, bigger)
        return photo
      }
      default:
        return ''
    }
  }

  static parseProfileByEmail(email: string): UserProfile {
    return {
      name: email.substring(0, email.lastIndexOf('@')),
      photo: generateAvatarURL('', email, false),
      biggerphoto: generateAvatarURL('', email, true)
    }
  }
}
