import {InternalOAuthError, Strategy, StrategyOptions, VerifyFunction} from "passport-oauth2";
import config from "../../config";

interface Oauth2Profile {
  id: string
  username: string
  displayName: string
  email: string
  photo: string
}

// eslint-disable-next-line
type ProfileData = Record<string, any> | string

export function parseProfile(data: ProfileData): Oauth2Profile {
  const username = extractProfileAttribute(data, config.oauth2.userProfileUsernameAttr) as string
  const displayName = extractProfileAttribute(data, config.oauth2.userProfileDisplayNameAttr) as string
  const email = extractProfileAttribute(data, config.oauth2.userProfileEmailAttr) as string
  const photo = extractProfileAttribute(data, config.oauth2.userProfilePhotoAttr) as string

  if (!username) {
    throw new Error('cannot fetch username: please set correct CMD_OAUTH2_USER_PROFILE_USERNAME_ATTR')
  }

  return {
    id: username,
    username: username,
    displayName: displayName,
    email: email,
    photo: photo
  }
}

export function extractProfileAttribute(data: ProfileData, path: string): string | string[] | undefined {
  if (!data) return undefined
  if (typeof path !== 'string') return undefined
  // can handle stuff like `attrs[0].name`
  const pathSegments = path.split('.')
  for (const segment of pathSegments) {
    const m = segment.match(/([\d\w]+)\[(.*)\]/)
    if (!m) {
      data = data[segment]
    } else {
      if (m.length < 3) return undefined
      if (!data[m[1]]) return undefined
      data = data[m[1]][m[2]]
    }
    if (!data) return undefined
  }
  return data as string
}

interface OAuth2CustomStrategyOptions extends StrategyOptions {
  userProfileURL
}

export class OAuth2CustomStrategy extends Strategy {
  private readonly _userProfileURL: string;

  constructor(options: OAuth2CustomStrategyOptions, verify: VerifyFunction) {
    options.customHeaders = options.customHeaders || {}
    super(options, verify)
    this.name = 'oauth2'
    this._userProfileURL = options.userProfileURL
    this._oauth2.useAuthorizationHeaderforGET(true)
  }

  userProfile(accessToken: string, done: (err: Error | null, profile?: Oauth2Profile) => void): void {
    this._oauth2.get(this._userProfileURL, accessToken, function (err, body) {
      if (err) {
        return done(new InternalOAuthError('Failed to fetch user profile', err))
      }

      let profile, json
      try {
        json = JSON.parse(body.toString())
        profile = parseProfile(json)
      } catch (ex) {
        return done(new InternalOAuthError('Failed to parse user profile' + ex.toString(), null))
      }

      profile.provider = 'oauth2'

      done(null, profile)
    })
  }
}
