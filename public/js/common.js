var config = require('./config');
var domain = config.domain; // domain name
var urlpath = config.urlpath; // sub url path, like: www.example.com/<urlpath>
var debug = config.debug;
var GOOGLE_API_KEY = config.GOOGLE_API_KEY;
var GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
var DROPBOX_APP_KEY = config.DROPBOX_APP_KEY;

//common
var port = window.location.port;
var serverurl = window.location.protocol + '//' + (domain ? domain : window.location.hostname) + (port ? ':' + port : '') + (urlpath ? '/' + urlpath : '');
var noteid = urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1];
var noteurl = serverurl + '/' + noteid;

var version = '0.4.5';

var checkAuth = false;
var profile = null;
var lastLoginState = getLoginState();
var lastUserId = getUserId();
var loginStateChangeEvent = null;

function resetCheckAuth() {
    checkAuth = false;
}

function setLoginState(bool, id) {
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

function checkLoginStateChanged() {
    if (getLoginState() != lastLoginState || getUserId() != lastUserId) {
        if(loginStateChangeEvent)
            loginStateChangeEvent();
        return true;
    } else {
        return false;
    }
}

function getLoginState() {
    var state = Cookies.get('loginstate');
    return state === "true" || state === true;
}

function getUserId() {
    return Cookies.get('userid');
}

function clearLoginState() {
    Cookies.remove('loginstate');
}

function checkIfAuth(yesCallback, noCallback) {
    var cookieLoginState = getLoginState();
    if (checkLoginStateChanged())
        checkAuth = false;
    if (!checkAuth || typeof cookieLoginState == 'undefined') {
        $.get(serverurl + '/me')
            .done(function (data) {
                if (data && data.status == 'ok') {
                    profile = data;
                    yesCallback(profile);
                    setLoginState(true, data.id);
                } else {
                    noCallback();
                    setLoginState(false);
                }
            })
            .fail(function () {
                noCallback();
            })
            .always(function () {
                checkAuth = true;
            });
    } else if (cookieLoginState) {
        yesCallback(profile);
    } else {
        noCallback();
    }
}

module.exports = {
  domain: domain,
  urlpath: urlpath,
  debug: debug,
  GOOGLE_API_KEY: GOOGLE_API_KEY,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
  DROPBOX_APP_KEY: DROPBOX_APP_KEY,
  port: port,
  serverurl: serverurl,
  noteid: noteid,
  noteurl: noteurl,
  version: version,
  checkAuth: checkAuth,
  profile: profile,
  lastLoginState: lastLoginState,
  lastUserId: lastUserId,
  loginStateChangeEvent: loginStateChangeEvent,

  /* export functions */
  resetCheckAuth: resetCheckAuth,
  setLoginState: setLoginState,
  checkLoginStateChanged: checkLoginStateChanged,
  getLoginState: getLoginState,
  getUserId: getUserId,
  clearLoginState: clearLoginState,
  checkIfAuth: checkIfAuth
};
