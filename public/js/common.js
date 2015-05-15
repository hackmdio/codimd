//common
var domain = 'change this';
var checkAuth = false;
var profile = null;
var lastLoginState = getLoginState();
var loginStateChangeEvent = null;

function resetCheckAuth() {
    checkAuth = false;
}

function setLoginState(bool) {
    Cookies.set('loginstate', bool, {
        expires: 14
    });
    if (loginStateChangeEvent && bool != lastLoginState)
        loginStateChangeEvent();
    lastLoginState = bool;
}

function getLoginState() {
    return Cookies.get('loginstate') === "true";
}

function clearLoginState() {
    Cookies.remove('loginstate');
}

function checkIfAuth(yesCallback, noCallback) {
    var cookieLoginState = getLoginState();
    if (!checkAuth || typeof cookieLoginState == 'undefined') {
        $.get('/me')
            .done(function (data) {
                if (data && data.status == 'ok') {
                    profile = data;
                    yesCallback(profile);
                    setLoginState(true);
                } else {
                    noCallback();
                    setLoginState(false);
                }
            })
            .fail(function () {
                noCallback();
                setLoginState(false);
            });
        checkAuth = true;
    } else if (cookieLoginState) {
        yesCallback(profile);
    } else {
        noCallback();
    }
}