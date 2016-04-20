//common
var domain = 'change this'; // domain name
var urlpath = ''; // sub url path, like: www.example.com/<urlpath>
//settings
var debug = false;

var GOOGLE_API_KEY = 'change this';
var GOOGLE_CLIENT_ID = 'change this';

var port = window.location.port;
var serverurl = window.location.protocol + '//' + domain + (port ? ':' + port : '') + (urlpath ? '/' + urlpath : '');
var noteid = urlpath ? window.location.pathname.slice(urlpath.length + 1, window.location.pathname.length).split('/')[1] : window.location.pathname.split('/')[1];
var noteurl = serverurl + '/' + noteid;

var version = '0.3.4';

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
        expires: 14
    });
    if (id) {
        Cookies.set('userid', id, {
            expires: 14
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
    return Cookies.get('loginstate') === "true";
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
                setLoginState(false);
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