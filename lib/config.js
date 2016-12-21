// external modules
var path = require('path');

// configs
var env = process.env.NODE_ENV || 'development';
var config = require(path.join(__dirname, '..', 'config.json'))[env];
var debug = process.env.DEBUG ? (process.env.DEBUG === 'true') : ((typeof config.debug === 'boolean') ? config.debug : (env === 'development'));

// url
var domain = process.env.DOMAIN || process.env.HMD_DOMAIN || config.domain || '';
var urlpath = process.env.URL_PATH || process.env.HMD_URL_PATH || config.urlpath || '';
var port = process.env.PORT || process.env.HMD_PORT || config.port || 3000;
var alloworigin = process.env.HMD_ALLOW_ORIGIN ? process.env.HMD_ALLOW_ORIGIN.split(',') : (config.alloworigin || ['localhost']);

var usessl = !!config.usessl;
var protocolusessl = (usessl === true && typeof process.env.HMD_PROTOCOL_USESSL === 'undefined' && typeof config.protocolusessl === 'undefined')
     ? true : (process.env.HMD_PROTOCOL_USESSL ? (process.env.HMD_PROTOCOL_USESSL === 'true') : !!config.protocolusessl);
var urladdport = process.env.HMD_URL_ADDPORT ? (process.env.HMD_URL_ADDPORT === 'true') : !!config.urladdport;

var usecdn = process.env.HMD_USECDN ? (process.env.HMD_USECDN === 'true') : ((typeof config.usecdn === 'boolean') ? config.usecdn : true);

var allowanonymous = process.env.HMD_ALLOW_ANONYMOUS ? (process.env.HMD_ALLOW_ANONYMOUS === 'true') : ((typeof config.allowanonymous === 'boolean') ? config.allowanonymous : true);

var allowfreeurl = process.env.HMD_ALLOW_FREEURL ? (process.env.HMD_ALLOW_FREEURL === 'true') : !!config.allowfreeurl;

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

// image upload setting, available options are imgur/s3/filesystem
var imageUploadType = process.env.HMD_IMAGE_UPLOAD_TYPE || config.imageUploadType || 'imgur';

config.s3 = config.s3 || {};
var s3 = {
    accessKeyId: process.env.HMD_S3_ACCESS_KEY_ID || config.s3.accessKeyId,
    secretAccessKey: process.env.HMD_S3_SECRET_ACCESS_KEY || config.s3.secretAccessKey,
    region: process.env.HMD_S3_REGION || config.s3.region
}
var s3bucket = process.env.HMD_S3_BUCKET || config.s3.bucket;

// auth
var facebook = (process.env.HMD_FACEBOOK_CLIENTID && process.env.HMD_FACEBOOK_CLIENTSECRET) ? {
    clientID: process.env.HMD_FACEBOOK_CLIENTID,
    clientSecret: process.env.HMD_FACEBOOK_CLIENTSECRET
} : config.facebook || false;
var twitter = (process.env.HMD_TWITTER_CONSUMERKEY && process.env.HMD_TWITTER_CONSUMERSECRET) ? {
    consumerKey: process.env.HMD_TWITTER_CONSUMERKEY,
    consumerSecret: process.env.HMD_TWITTER_CONSUMERSECRET
} : config.twitter || false;
var github = (process.env.HMD_GITHUB_CLIENTID && process.env.HMD_GITHUB_CLIENTSECRET) ? {
    clientID: process.env.HMD_GITHUB_CLIENTID,
    clientSecret: process.env.HMD_GITHUB_CLIENTSECRET
} : config.github || false;
var gitlab = (process.env.HMD_GITLAB_CLIENTID && process.env.HMD_GITLAB_CLIENTSECRET) ? {
    baseURL: process.env.HMD_GITLAB_BASEURL,
    clientID: process.env.HMD_GITLAB_CLIENTID,
    clientSecret: process.env.HMD_GITLAB_CLIENTSECRET
} : config.gitlab || false;
var dropbox = (process.env.HMD_DROPBOX_CLIENTID && process.env.HMD_DROPBOX_CLIENTSECRET) ? {
    clientID: process.env.HMD_DROPBOX_CLIENTID,
    clientSecret: process.env.HMD_DROPBOX_CLIENTSECRET
} : config.dropbox || false;
var google = (process.env.HMD_GOOGLE_CLIENTID && process.env.HMD_GOOGLE_CLIENTSECRET) ? {
    clientID: process.env.HMD_GOOGLE_CLIENTID,
    clientSecret: process.env.HMD_GOOGLE_CLIENTSECRET
} : config.google || false;
var imgur = process.env.HMD_IMGUR_CLIENTID || config.imgur || false;
var email = process.env.HMD_EMAIL ? (process.env.HMD_EMAIL === 'true') : !!config.email;

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

var version = '0.4.6';
var minimumCompatibleVersion = '0.4.5';
var maintenance = true;
var cwd = path.join(__dirname, '..');

module.exports = {
    version: version,
    minimumCompatibleVersion: minimumCompatibleVersion,
    maintenance: maintenance,
    debug: debug,
    urlpath: urlpath,
    port: port,
    alloworigin: alloworigin,
    usessl: usessl,
    serverurl: getserverurl(),
    usecdn: usecdn,
    allowanonymous: allowanonymous,
    allowfreeurl: allowfreeurl,
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
    imgur: imgur,
    email: email,
    imageUploadType: imageUploadType,
    s3: s3,
    s3bucket: s3bucket
};
