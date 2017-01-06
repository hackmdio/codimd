// import config from './config';

import {
    domain, // domain name
    urlpath, // sub url path, like: www.example.com/<urlpath>
    debug,
    GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID,
    DROPBOX_APP_KEY
} from './config';

//common
export const port = window.location.port;
window.serverurl = `${window.location.protocol}//${domain ? domain : window.location.hostname}${port ? ':' + port : ''}${urlpath ? '/' + urlpath : ''}`;
export const noteid = urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1];
export const noteurl = `${serverurl}/${noteid}`;

export const version = '0.5.0';

let checkAuth = false;
let profile = null;
let lastLoginState = getLoginState();
let lastUserId = getUserId();
let loginStateChangeEvent = null;

export function setloginStateChangeEvent(func) {
    loginStateChangeEvent = func;
}

export function resetCheckAuth() {
    checkAuth = false;
}

export function setLoginState(bool, id) {
    Cookies.set('loginstate', bool, {
        expires: 365
    });
    if (id) {
        Cookies.set('userid', id, {
            expires: 365
        });
    } else {
        Cookies.remove('userid');
    }
    lastLoginState = bool;
    lastUserId = id;
    checkLoginStateChanged();
}

export function checkLoginStateChanged() {
    if (getLoginState() != lastLoginState || getUserId() != lastUserId) {
        if(loginStateChangeEvent) {
            loginStateChangeEvent();
        }
        return true;
    } else {
        return false;
    }
}

export function getLoginState() {
    const state = Cookies.get('loginstate');
    return state === "true" || state === true;
}

export function getUserId() {
    return Cookies.get('userid');
}

export function clearLoginState() {
    Cookies.remove('loginstate');
}

export function checkIfAuth(yesCallback, noCallback) {
    const cookieLoginState = getLoginState();
    if (checkLoginStateChanged())
        checkAuth = false;
    if (!checkAuth || typeof cookieLoginState == 'undefined') {
        $.get(`${serverurl}/me`)
            .done(data => {
                if (data && data.status == 'ok') {
                    profile = data;
                    yesCallback(profile);
                    setLoginState(true, data.id);
                } else {
                    noCallback();
                    setLoginState(false);
                }
            })
            .fail(() => {
                noCallback();
            })
            .always(() => {
                checkAuth = true;
            });
    } else if (cookieLoginState) {
        yesCallback(profile);
    } else {
        noCallback();
    }
}

export default {
    domain,
    urlpath,
    debug,
    GOOGLE_API_KEY,
    GOOGLE_CLIENT_ID,
    DROPBOX_APP_KEY,
    checkAuth,
    profile,
    lastLoginState,
    lastUserId,
    loginStateChangeEvent
};
