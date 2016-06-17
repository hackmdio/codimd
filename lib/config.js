// external modules
var path = require('path');

// configs
var env = process.env.NODE_ENV || 'development';
var config = require(path.join(__dirname, '..', 'config.json'))[env];
var debug = process.env.DEBUG ? (process.env.DEBUG === 'true') : ((typeof config.debug === 'boolean') ? config.debug : (env === 'development'));

// url
var domain = process.env.DOMAIN || config.domain || '';
var urlpath = process.env.URL_PATH || config.urlpath || '';
var port = process.env.PORT || config.port || 3000;
var alloworigin = config.alloworigin || ['localhost'];

var usessl = !!config.usessl;
var protocolusessl = (config.usessl === true && typeof config.protocolusessl === 'undefined') ? true : !!config.protocolusessl;
var urladdport = !!config.urladdport;

var usecdn = !!config.usecdn;

// db
var db = config.db || {
    dialect: 'sqlite',
    storage: './db.hackmd.sqlite'
};

// ssl path
var sslkeypath = config.sslkeypath || '';
var sslcertpath = config.sslcertpath || '';
var sslcapath = config.sslcapath || '';
var dhparampath = config.dhparampath || '';

// other path
var tmppath = config.tmppath || './tmp';
var defaultnotepath = config.defaultnotepath || './public/default.md';
var docspath = config.docspath || './public/docs';
var indexpath = config.indexpath || './public/views/index.ejs';
var hackmdpath = config.hackmdpath || './public/views/hackmd.ejs';
var errorpath = config.errorpath || './public/views/error.ejs';
var prettypath = config.prettypath || './public/views/pretty.ejs';
var slidepath = config.slidepath || './public/views/slide.ejs';

// session
var sessionname = config.sessionname || 'connect.sid';
var sessionsecret = config.sessionsecret || 'secret';
var sessionlife = config.sessionlife || 14 * 24 * 60 * 60 * 1000; //14 days

// static files
var staticcachetime = config.staticcachetime || 1 * 24 * 60 * 60 * 1000; // 1 day

// socket.io
var heartbeatinterval = config.heartbeatinterval || 5000;
var heartbeattimeout = config.heartbeattimeout || 10000;

// document
var documentmaxlength = config.documentmaxlength || 100000;

// auth
var facebook = config.facebook || false;
var twitter = config.twitter || false;
var github = config.github || false;
var gitlab = config.gitlab || false;
var dropbox = config.dropbox || false;
var google = config.google || false;
var imgur = config.imgur || false;

function getserverurl() {
    var url = '';
    if (domain) {
        var protocol = protocolusessl ? 'https://' : 'http://';
        url = protocol + domain;
        if (urladdport && ((usessl && port != 443) || (!usessl && port != 80)))
            url += ':' + port;
    }
    if (urlpath)
        url += '/' + urlpath;
    return url;
}

var version = '0.4.2';
var maintenance = true;
var cwd = path.join(__dirname, '..');

module.exports = {
    version: version,
    maintenance: maintenance,
    debug: debug,
    urlpath: urlpath,
    port: port,
    alloworigin: alloworigin,
    usessl: usessl,
    serverurl: getserverurl(),
    usecdn: usecdn,
    db: db,
    sslkeypath: path.join(cwd, sslkeypath),
    sslcertpath: path.join(cwd, sslcertpath),
    sslcapath: path.join(cwd, sslcapath),
    dhparampath: path.join(cwd, dhparampath),
    tmppath: path.join(cwd, tmppath),
    defaultnotepath: path.join(cwd, defaultnotepath),
    docspath: path.join(cwd, docspath),
    indexpath: path.join(cwd, indexpath),
    hackmdpath: path.join(cwd, hackmdpath),
    errorpath: path.join(cwd, errorpath),
    prettypath: path.join(cwd, prettypath),
    slidepath: path.join(cwd, slidepath),
    sessionname: sessionname,
    sessionsecret: sessionsecret,
    sessionlife: sessionlife,
    staticcachetime: staticcachetime,
    heartbeatinterval: heartbeatinterval,
    heartbeattimeout: heartbeattimeout,
    documentmaxlength: documentmaxlength,
    facebook: facebook,
    twitter: twitter,
    github: github,
    gitlab: gitlab,
    dropbox: dropbox,
    google: google,
    imgur: imgur
};
