'use strict'

import {Request} from "express";
import {User} from "../models";
import config from "../config";
import {logger} from "../logger";

export function setReturnToFromReferer(req: Request): void {
  // eslint-disable-next-line
  // @ts-ignore
  if (!req.session) req.session = {}

  const referer = req.get('referer')
  let nextURL
  if (referer) {
    try {
      const refererSearchParams = new URLSearchParams(new URL(referer).search)
      nextURL = refererSearchParams.get('next')
    } catch (err) {
      logger.warn(err)
    }
  }

  if (nextURL) {
    const isRelativeNextURL = nextURL.indexOf('://') === -1 && !nextURL.startsWith('//')
    if (isRelativeNextURL) {
      req.session.returnTo = (new URL(nextURL, config.serverURL)).toString()
    } else {
      req.session.returnTo = config.serverURL
    }
  } else {
    req.session.returnTo = referer
  }
}

interface Profile {
  id?: string
}

export function passportGeneralCallback(accessToken: string, refreshToken: string, profile: Profile, done: (err: Error | null, user?: User) => void): void {
  const stringifiedProfile = JSON.stringify(profile)
  User.findOrCreate({
    where: {
      profileid: profile.id.toString()
    },
    defaults: {
      profile: stringifiedProfile,
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  }).spread(function (user) {
    if (user) {
      let needSave = false
      if (user.profile !== stringifiedProfile) {
        user.profile = stringifiedProfile
        needSave = true
      }
      if (user.accessToken !== accessToken) {
        user.accessToken = accessToken
        needSave = true
      }
      if (user.refreshToken !== refreshToken) {
        user.refreshToken = refreshToken
        needSave = true
      }
      if (needSave) {
        user.save().then(function () {
          if (config.debug) {
            logger.info('user login: ' + user.id)
          }
          return done(null, user)
        })
      } else {
        if (config.debug) {
          logger.info('user login: ' + user.id)
        }
        return done(null, user)
      }
    }
  }).catch(function (err) {
    logger.error('auth callback failed: ' + err)
    return done(err, null)
  })
}
