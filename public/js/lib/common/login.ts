/* eslint-env browser, jquery */
/* global Cookies */

import Cookies from 'js-cookie'

import {serverurl} from '../config'

type PureFunction = () => void

let checkAuth: boolean = false
let profile = null
let lastLoginState = getLoginState()
let lastUserId: string | null = getUserId()
let loginStateChangeEvent: PureFunction | null = null

export function setLoginStateChangeEvent(func: PureFunction): void {
  loginStateChangeEvent = func
}

export function resetCheckAuth(): void {
  checkAuth = false
}

function setLoginState(bool: boolean, id?: string) {
  Cookies.set('loginstate', String(bool), {
    expires: 365
  })
  if (id) {
    Cookies.set('userid', id, {
      expires: 365
    })
  } else {
    Cookies.remove('userid')
  }
  lastLoginState = bool
  lastUserId = id || null
  checkLoginStateChanged()
}

export function checkLoginStateChanged(): boolean {
  if (getLoginState() !== lastLoginState || getUserId() !== lastUserId) {
    if (loginStateChangeEvent) setTimeout(loginStateChangeEvent, 100)
    return true
  }
  return false
}

export function getLoginState(): boolean {
  const state = Cookies.get('loginstate')
  return state === 'true'
}

function getUserId(): string {
  return Cookies.get('userid') || ""
}

export function clearLoginState(): void {
  Cookies.remove('loginstate')
}

type YesCallbackFunc = (profile: any) => void

/**
 * getLoginUserProfile
 * @throws Error when user not login
 * @return profile user profile
 */
export async function getLoginUserProfile(): Promise<any> {
  return new Promise(function (resolve, reject) {
    const cookieLoginState = getLoginState()
    if (checkLoginStateChanged()) checkAuth = false
    if (!checkAuth || typeof cookieLoginState === 'undefined') {
      $.get(`${serverurl}/me`)
        .done(data => {
          if (data && data.status === 'ok') {
            profile = data
            setLoginState(true, data.id)
            return resolve(profile)
          } else {
            setLoginState(false)
            return reject(new Error('user not login'))
          }
        })
        .fail(() => {
          return reject(new Error('user not login'))
        })
        .always(() => {
          checkAuth = true
        })
    } else if (cookieLoginState) {
      return resolve(profile)
    } else {
      return reject(new Error('user not login'))
    }
  })
}

export async function isLogin(): Promise<boolean> {
  try {
    await getLoginUserProfile()
    return true
  } catch (e) {
    return false
  }
}

export function checkIfAuth(yesCallback: YesCallbackFunc, noCallback: PureFunction) {
  getLoginUserProfile().then((profile) => {
    yesCallback(profile)
  }).catch(() => {
    noCallback()
  })
}
