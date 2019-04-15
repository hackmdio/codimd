CodiMD
===

[![CodiMD on Gitter][gitter-image]][gitter-url]
[![build status][travis-image]][travis-url]
[![version][github-version-badge]][github-release-page]
[![POEditor][poeditor-image]][poeditor-url]

CodiMD lets you create real-time collaborative markdown notes on all platforms.
Inspired by Hackpad, with more focus on speed and flexibility, and build from [HackMD](https://hackmd.io) source code.
Feel free to contribute.

Thanks for using! :smile:

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Table of Contents

- [HackMD CE became CodiMD](#hackmd-ce-became-codimd)
- [Browsers Requirement](#browsers-requirement)
- [Installation](#installation)
  - [Getting started (Native install)](#getting-started-native-install)
    - [Prerequisite](#prerequisite)
    - [Instructions](#instructions)
  - [Heroku Deployment](#heroku-deployment)
  - [Kubernetes](#kubernetes)
- [Upgrade](#upgrade)
  - [Native setup](#native-setup)
- [Configuration](#configuration)
  - [Environment variables (will overwrite other server configs)](#environment-variables-will-overwrite-other-server-configs)
  - [Application settings `config.json`](#application-settings-configjson)
  - [Third-party integration API key settings](#third-party-integration-api-key-settings)
  - [Third-party integration OAuth callback URLs](#third-party-integration-oauth-callback-urls)
- [Developer Notes](#developer-notes)
  - [Structure](#structure)
  - [Operational Transformation](#operational-transformation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# HackMD CE became CodiMD

CodiMD was recently renamed from its former name was HackMD. CodiMD is the free software version of HackMD. HackMD EE, which is a SaaS (Software as a Service) product available at [hackmd.io](https://hackmd.io).

We decided to change the name to break the confusion between HackMD and CodiMD, formally known as HackMD CE, as it never was an open core project.

*For the whole renaming story, see the [related issue](https://github.com/hackmdio/hackmd/issues/720)*

# Browsers Requirement

- ![Chrome](http://browserbadge.com/chrome/47/18px) Chrome >= 47, Chrome for Android >= 47
- ![Safari](http://browserbadge.com/safari/9/18px) Safari >= 9, iOS Safari >= 8.4
- ![Firefox](http://browserbadge.com/firefox/44/18px) Firefox >= 44
- ![IE](http://browserbadge.com/ie/9/18px) IE >= 9, Edge >= 12
- ![Opera](http://browserbadge.com/opera/34/18px) Opera >= 34, Opera Mini not supported
- Android Browser >= 4.4

# Installation

## Getting started (Native install)

### Prerequisite

- Node.js 6.x or up (test up to 7.5.0) and <10.x
- Database (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL) use charset `utf8`
- npm (and its dependencies, especially [uWebSockets](https://github.com/uWebSockets/uWebSockets#nodejs-developers), [node-gyp](https://github.com/nodejs/node-gyp#installation))
- `libssl-dev` for building scrypt (see [here](https://github.com/ml1nk/node-scrypt/blob/master/README.md#installation-instructions) for further information)
- For **building** CodiMD we recommend to use a machine with at least **2GB** RAM

### Instructions

1. Download a release and unzip or clone into a directory
2. Enter the directory and type `bin/setup`, which will install npm dependencies and create configs. The setup script is written in Bash, you would need bash as a prerequisite.
3. Setup the configs, see more below
4. Setup environment variables which will overwrite the configs
5. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
6. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string
   For example: `postgres://username:password@localhost:5432/codimd`
7. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema
8. Run the server as you like (node, forever, pm2)

To stay up to date with your installation it's recommended to subscribe the [release feed][github-release-feed].

## Heroku Deployment

You can quickly setup a sample Heroku CodiMD application by clicking the button below.

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/hackmdio/codimd/tree/master)

If you deploy it without the button, keep in mind to use the right buildpacks. For details check `app.json`.

## Kubernetes

To install use `helm install stable/hackmd`.

For all further details, please check out the offical CodiMD  [K8s helm chart](https://github.com/kubernetes/charts/tree/master/stable/hackmd).

**Debian-based version:**

[![latest](https://images.microbadger.com/badges/version/hackmdio/hackmd:latest.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/hackmdio/hackmd:latest.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own image badge on microbadger.com")

The easiest way to setup CodiMD using docker are using the following three commands:

```console
git clone https://github.com/hackmdio/docker-hackmd.git
cd docker-hackmd
docker-compose up
```
Read more about it in the [container repository…](https://github.com/hackmdio/docker-hackmd)

# Upgrade

## Native setup

If you are upgrading CodiMD from an older version, follow these steps:

1. Fully stop your old server first (important)
2. `git pull` or do whatever that updates the files
3. `npm install` to update dependencies
4. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
5. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string
   For example: `postgres://username:password@localhost:5432/codimd`
6. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema
7. Start your whole new server!

To stay up to date with your installation it's recommended to subscribe the [release feed][github-release-feed].

* **migrate-to-1.1.0**

We deprecated the older lower case config style and moved on to camel case style. Please have a look at the current `config.json.example` and check the warnings on startup.

*Notice: This is not a breaking change right now but in the future*

* [**migration-to-0.5.0**](https://github.com/hackmdio/migration-to-0.5.0)

We don't use LZString to compress socket.io data and DB data after version 0.5.0.
Please run the migration tool if you're upgrading from the old version.

* [**migration-to-0.4.0**](https://github.com/hackmdio/migration-to-0.4.0)

We've dropped MongoDB after version 0.4.0.
So here is the migration tool for you to transfer the old DB data to the new DB.
This tool is also used for official service.

# Configuration

There are some config settings you need to change in the files below.

```
./config.json      ----application settings
```

## Environment variables (will overwrite other server configs)

| variables | example values | description |
| --------- | ------ | ----------- |
| `NODE_ENV`  | `production` or `development` | set current environment (will apply corresponding settings in the `config.json`) |
| `DEBUG` | `true` or `false` | set debug mode; show more logs |
| `CMD_CONFIG_FILE` | `/path/to/config.json` | optional override for the path to CodiMD's config file |
| `CMD_DOMAIN` | `codimd.org` | domain name |
| `CMD_URL_PATH` | `codimd` | sub URL path, like `www.example.com/<URL_PATH>` |
| `CMD_HOST` | `localhost` | host to listen on |
| `CMD_PORT` | `80` | web app port |
| `CMD_PATH` | `/var/run/codimd.sock` | path to UNIX domain socket to listen on (if specified, `CMD_HOST` and `CMD_PORT` are ignored) |
| `CMD_LOGLEVEL` | `info` | Defines what kind of logs are provided to stdout. |
| `CMD_ALLOW_ORIGIN` | `localhost, codimd.org` | domain name whitelist (use comma to separate) |
| `CMD_PROTOCOL_USESSL` | `true` or `false` | set to use SSL protocol for resources path (only applied when domain is set) |
| `CMD_URL_ADDPORT` | `true` or `false` | set to add port on callback URL (ports `80` or `443` won't be applied) (only applied when domain is set) |
| `CMD_USECDN` | `true` or `false` | set to use CDN resources or not (default is `true`) |
| `CMD_ALLOW_ANONYMOUS` | `true` or `false` | set to allow anonymous usage (default is `true`) |
| `CMD_ALLOW_ANONYMOUS_EDITS` | `true` or `false` | if `allowAnonymous` is `true`, allow users to select `freely` permission, allowing guests to edit existing notes (default is `false`) |
| `CMD_ALLOW_FREEURL` | `true` or `false` | set to allow new note creation by accessing a nonexistent note URL |
| `CMD_FORBIDDEN_NODE_IDS` | `'robots.txt'` | disallow creation of notes, even if `CMD_ALLOW_FREEURL` is `true` |
| `CMD_DEFAULT_PERMISSION` | `freely`, `editable`, `limited`, `locked` or `private` | set notes default permission (only applied on signed users) |
| `CMD_DB_URL` | `mysql://localhost:3306/database` | set the database URL |
| `CMD_SESSION_SECRET` | no example | Secret used to sign the session cookie. If non is set, one will randomly generated on startup |
| `CMD_SESSION_LIFE` | `1209600000` | Session life time. (milliseconds) |
| `CMD_FACEBOOK_CLIENTID` | no example | Facebook API client id |
| `CMD_FACEBOOK_CLIENTSECRET` | no example | Facebook API client secret |
| `CMD_TWITTER_CONSUMERKEY` | no example | Twitter API consumer key |
| `CMD_TWITTER_CONSUMERSECRET` | no example | Twitter API consumer secret |
| `CMD_GITHUB_CLIENTID` | no example | GitHub API client id |
| `CMD_GITHUB_CLIENTSECRET` | no example | GitHub API client secret |
| `CMD_GITLAB_SCOPE` | `read_user` or `api` | GitLab API requested scope (default is `api`) (GitLab snippet import/export need `api` scope) |
| `CMD_GITLAB_BASEURL` | no example | GitLab authentication endpoint, set to use other endpoint than GitLab.com (optional) |
| `CMD_GITLAB_CLIENTID` | no example | GitLab API client id |
| `CMD_GITLAB_CLIENTSECRET` | no example | GitLab API client secret |
| `CMD_GITLAB_VERSION` | no example | GitLab API version (v3 or v4) |
| `CMD_MATTERMOST_BASEURL` | no example | Mattermost authentication endpoint for versions below 5.0. For Mattermost version 5.0 and above, see [guide](docs/guides/auth/mattermost-self-hosted.md). |
| `CMD_MATTERMOST_CLIENTID` | no example | Mattermost API client id |
| `CMD_MATTERMOST_CLIENTSECRET` | no example | Mattermost API client secret |
| `CMD_DROPBOX_CLIENTID` | no example | Dropbox API client id |
| `CMD_DROPBOX_CLIENTSECRET` | no example | Dropbox API client secret |
| `CMD_GOOGLE_CLIENTID` | no example | Google API client id |
| `CMD_GOOGLE_CLIENTSECRET` | no example | Google API client secret |
| `CMD_LDAP_URL` | `ldap://example.com` | URL of LDAP server |
| `CMD_LDAP_BINDDN` | no example | bindDn for LDAP access |
| `CMD_LDAP_BINDCREDENTIALS` | no example | bindCredentials for LDAP access |
| `CMD_LDAP_SEARCHBASE` | `o=users,dc=example,dc=com` | LDAP directory to begin search from |
| `CMD_LDAP_SEARCHFILTER` | `(uid={{username}})` | LDAP filter to search with |
| `CMD_LDAP_SEARCHATTRIBUTES` | `displayName, mail` | LDAP attributes to search with (use comma to separate) |
| `CMD_LDAP_USERIDFIELD` | `uidNumber` or `uid` or `sAMAccountName` | The LDAP field which is used uniquely identify a user on CodiMD |
| `CMD_LDAP_USERNAMEFIELD` | Fallback to userid | The LDAP field which is used as the username on CodiMD |
| `CMD_LDAP_TLS_CA` | `server-cert.pem, root.pem` | Root CA for LDAP TLS in PEM format (use comma to separate) |
| `CMD_LDAP_PROVIDERNAME` | `My institution` | Optional name to be displayed at login form indicating the LDAP provider |
| `CMD_SAML_IDPSSOURL` | `https://idp.example.com/sso` | authentication endpoint of IdP. for details, see [guide](docs/guides/auth/saml-onelogin.md). |
| `CMD_SAML_IDPCERT` | `/path/to/cert.pem` | certificate file path of IdP in PEM format |
| `CMD_SAML_ISSUER` | no example | identity of the service provider (optional, default: serverurl)" |
| `CMD_SAML_IDENTIFIERFORMAT` | no example | name identifier format (optional, default: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`) |
| `CMD_SAML_GROUPATTRIBUTE` | `memberOf` | attribute name for group list (optional) |
| `CMD_SAML_REQUIREDGROUPS` | `Hackmd-users` | group names that allowed (use vertical bar to separate) (optional) |
| `CMD_SAML_EXTERNALGROUPS` | `Temporary-staff` | group names that not allowed (use vertical bar to separate) (optional) |
| `CMD_SAML_ATTRIBUTE_ID` | `sAMAccountName` | attribute map for `id` (optional, default: NameID of SAML response) |
| `CMD_SAML_ATTRIBUTE_USERNAME` | `mailNickname` | attribute map for `username` (optional, default: NameID of SAML response) |
| `CMD_SAML_ATTRIBUTE_EMAIL` | `mail` | attribute map for `email` (optional, default: NameID of SAML response if `CMD_SAML_IDENTIFIERFORMAT` is default) |
| `CMD_OAUTH2_USER_PROFILE_URL` | `https://example.com` | where retrieve information about a user after succesful login. Needs to output JSON. (no default value) Refer to the [Mattermost](docs/guides/auth/mattermost-self-hosted.md) or [Nextcloud](docs/guides/auth/nextcloud.md) examples for more details on all of the `CMD_OAUTH2...` options. |
| `CMD_OAUTH2_USER_PROFILE_USERNAME_ATTR` | `name` | where to find the username in the JSON from the user profile URL. (no default value)|
| `CMD_OAUTH2_USER_PROFILE_DISPLAY_NAME_ATTR` | `display-name` | where to find the display-name in the JSON from the user profile URL. (no default value) |
| `CMD_OAUTH2_USER_PROFILE_EMAIL_ATTR` | `email` | where to find the email address in the JSON from the user profile URL. (no default value) |
| `CMD_OAUTH2_TOKEN_URL` | `https://example.com` | sometimes called token endpoint, please refer to the documentation of your OAuth2 provider (no default value) |
| `CMD_OAUTH2_AUTHORIZATION_URL` | `https://example.com` | authorization URL of your provider, please refer to the documentation of your OAuth2 provider (no default value) |
| `CMD_OAUTH2_CLIENT_ID` | `afae02fckafd...` | you will get this from your OAuth2 provider when you register CodiMD as OAuth2-client, (no default value) |
| `CMD_OAUTH2_CLIENT_SECRET` | `afae02fckafd...` | you will get this from your OAuth2 provider when you register CodiMD as OAuth2-client, (no default value) |
| `CMD_OAUTH2_PROVIDERNAME` | `My institution` | Optional name to be displayed at login form indicating the oAuth2 provider |
| `CMD_IMGUR_CLIENTID` | no example | Imgur API client id |
| `CMD_EMAIL` | `true` or `false` | set to allow email signin |
| `CMD_ALLOW_PDF_EXPORT` | `true` or `false` | Enable or disable PDF exports |
| `CMD_ALLOW_EMAIL_REGISTER` | `true` or `false` | set to allow email register (only applied when email is set, default is `true`. Note `bin/manage_users` might help you if registration is `false`.) |
| `CMD_ALLOW_GRAVATAR` | `true` or `false` | set to `false` to disable gravatar as profile picture source on your instance |
| `CMD_IMAGE_UPLOAD_TYPE` | `imgur`, `s3`, `minio` or `filesystem` | Where to upload images. For S3, see our Image Upload Guides for [S3](docs/guides/s3-image-upload.md) or [Minio](docs/guides/minio-image-upload.md) |
| `CMD_S3_ACCESS_KEY_ID` | no example | AWS access key id |
| `CMD_S3_SECRET_ACCESS_KEY` | no example | AWS secret key |
| `CMD_S3_REGION` | `ap-northeast-1` | AWS S3 region |
| `CMD_S3_BUCKET` | no example | AWS S3 bucket name |
| `CMD_S3_ENDPOINT` | s3.example.com | custom AWS S3 endpoint |
| `CMD_MINIO_ACCESS_KEY` | no example | Minio access key |
| `CMD_MINIO_SECRET_KEY` | no example | Minio secret key |
| `CMD_MINIO_ENDPOINT` | `minio.example.org` | Address of your Minio endpoint/instance |
| `CMD_MINIO_PORT` | `9000` | Port that is used for your Minio instance |
| `CMD_MINIO_SECURE` | `true` | If set to `true` HTTPS is used for Minio |
| `CMD_AZURE_CONNECTION_STRING` | no example | Azure Blob Storage connection string |
| `CMD_AZURE_CONTAINER` | no example | Azure Blob Storage container name (automatically created if non existent) |
| `CMD_HSTS_ENABLE` | ` true`  | set to enable [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) if HTTPS is also enabled (default is ` true`) |
| `CMD_HSTS_INCLUDE_SUBDOMAINS` | `true` | set to include subdomains in HSTS (default is `true`) |
| `CMD_HSTS_MAX_AGE` | `31536000` | max duration in seconds to tell clients to keep HSTS status (default is a year) |
| `CMD_HSTS_PRELOAD` | `true` | whether to allow preloading of the site's HSTS status (e.g. into browsers) |
| `CMD_CSP_ENABLE` | `true` | whether to enable Content Security Policy (directives cannot be configured with environment variables) |
| `CMD_CSP_REPORTURI` | `https://<someid>.report-uri.com/r/d/csp/enforce` | Allows to add a URL for CSP reports in case of violations |
| `CMD_SOURCE_URL` | `https://github.com/hackmdio/codimd/tree/<current commit>` | Provides the link to the source code of CodiMD on the entry page (Please, make sure you change this when you run a modified version) |

***Note:** Due to the rename process we renamed all `HMD_`-prefix variables to be `CMD_`-prefixed. The old ones continue to work.*

## Application settings `config.json`

| variables | example values | description |
| --------- | ------ | ----------- |
| `debug` | `true` or `false` | set debug mode, show more logs |
| `domain` | `localhost` | domain name |
| `urlPath` | `codimd` | sub URL path, like `www.example.com/<urlpath>` |
| `host` | `localhost` | host to listen on |
| `port` | `80` | web app port |
| `path` | `/var/run/codimd.sock` | path to UNIX domain socket to listen on (if specified, `host` and `port` are ignored) |
| `loglevel` | `info` | Defines what kind of logs are provided to stdout. |
| `allowOrigin` | `['localhost']` | domain name whitelist |
| `useSSL` | `true` or `false` | set to use SSL server (if `true`, will auto turn on `protocolUseSSL`) |
| `hsts` | `{"enable": true, "maxAgeSeconds": 31536000, "includeSubdomains": true, "preload": true}` | [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) options to use with HTTPS (default is the example value, max age is a year) |
| `csp` | `{"enable": true, "directives": {"scriptSrc": "trustworthy-scripts.example.com"}, "upgradeInsecureRequests": "auto", "addDefaults": true}` | Configures [Content Security Policy](https://helmetjs.github.io/docs/csp/). Directives are passed to Helmet - see [their documentation](https://helmetjs.github.io/docs/csp/) for more information on the format. Some defaults are added to the configured values so that the application doesn't break. To disable this behaviour, set `addDefaults` to `false`. Further, if `usecdn` is on, some CDN locations are allowed too. By default (`auto`), insecure (HTTP) requests are upgraded to HTTPS via CSP if `useSSL` is on. To change this behaviour, set `upgradeInsecureRequests` to either `true` or `false`. |
| `protocolUseSSL` | `true` or `false` | set to use SSL protocol for resources path (only applied when domain is set) |
| `urlAddPort` | `true` or `false` | set to add port on callback URL (ports `80` or `443` won't be applied) (only applied when domain is set) |
| `useCDN` | `true` or `false` | set to use CDN resources or not (default is `true`) |
| `allowAnonymous` | `true` or `false` | set to allow anonymous usage (default is `true`) |
| `allowAnonymousEdits` | `true` or `false` | if `allowAnonymous` is `true`: allow users to select `freely` permission, allowing guests to edit existing notes (default is `false`) |
| `allowFreeURL` | `true` or `false` | set to allow new note creation by accessing a nonexistent note URL |
| `forbiddenNoteIDs` | `['robots.txt']` | disallow creation of notes, even if `allowFreeUrl` is `true` |
| `defaultPermission` | `freely`, `editable`, `limited`, `locked`, `protected` or `private` | set notes default permission (only applied on signed users) |
| `dbURL` | `mysql://localhost:3306/database` | set the db URL; if set, then db config (below) won't be applied |
| `db` | `{ "dialect": "sqlite", "storage": "./db.codimd.sqlite" }` | set the db configs, [see more here](http://sequelize.readthedocs.org/en/latest/api/sequelize/) |
| `sslKeyPath` | `./cert/client.key` | SSL key path<sup>1</sup> (only need when you set `useSSL`) |
| `sslCertPath` | `./cert/codimd_io.crt` | SSL cert path<sup>1</sup> (only need when you set `useSSL`) |
| `sslCAPath` | `['./cert/COMODORSAAddTrustCA.crt']` | SSL ca chain<sup>1</sup> (only need when you set `useSSL`) |
| `dhParamPath` | `./cert/dhparam.pem` | SSL dhparam path<sup>1</sup> (only need when you set `useSSL`) |
| `tmpPath` | `./tmp/` | temp directory path<sup>1</sup> |
| `defaultNotePath` | `./public/default.md` | default note file path<sup>1</sup> |
| `docsPath` | `./public/docs` | docs directory path<sup>1</sup> |
| `viewPath` | `./public/views` | template directory path<sup>1</sup> |
| `uploadsPath` | `./public/uploads` | uploads directory<sup>1</sup> - needs to be persistent when you use imageUploadType `filesystem` |
| `sessionName` | `connect.sid` | cookie session name |
| `sessionSecret` | `secret` | cookie session secret |
| `sessionLife` | `14 * 24 * 60 * 60 * 1000` | cookie session life |
| `staticCacheTime` | `1 * 24 * 60 * 60 * 1000` | static file cache time |
| `heartbeatInterval` | `5000` | socket.io heartbeat interval |
| `heartbeatTimeout` | `10000` | socket.io heartbeat timeout |
| `documentMaxLength` | `100000` | note max length |
| `email` | `true` or `false` | set to allow email signin |
| `oauth2` | `{baseURL: ..., userProfileURL: ..., userProfileUsernameAttr: ..., userProfileDisplayNameAttr: ..., userProfileEmailAttr: ..., tokenURL: ..., authorizationURL: ..., clientID: ..., clientSecret: ...}` | An object detailing your OAuth2 provider. Refer to the [Mattermost](docs/guides/auth/mattermost-self-hosted.md) or [Nextcloud](docs/guides/auth/nextcloud.md) examples for more details!|
| `allowEmailRegister`  | `true` or `false` | set to allow email register (only applied when email is set, default is `true`. Note `bin/manage_users` might help you if registration is `false`.) |
| `allowGravatar` | `true` or `false` | set to `false` to disable gravatar as profile picture source on your instance |
| `imageUploadType` | `imgur`, `s3`, `minio`, `azure` or `filesystem`(default) | Where to upload images. For S3, see our Image Upload Guides for [S3](docs/guides/s3-image-upload.md) or [Minio](docs/guides/minio-image-upload.md)|
| `minio` | `{ "accessKey": "YOUR_MINIO_ACCESS_KEY", "secretKey": "YOUR_MINIO_SECRET_KEY", "endpoint": "YOUR_MINIO_HOST", port: 9000, secure: true }` | When `imageUploadType` is set to `minio`, you need to set this key. Also checkout our [Minio Image Upload Guide](docs/guides/minio-image-upload.md) |
| `s3` | `{ "accessKeyId": "YOUR_S3_ACCESS_KEY_ID", "secretAccessKey": "YOUR_S3_ACCESS_KEY", "region": "YOUR_S3_REGION" }` | When `imageuploadtype` be set to `s3`, you would also need to setup this key, check our [S3 Image Upload Guide](docs/guides/s3-image-upload.md) |
| `s3bucket` | `YOUR_S3_BUCKET_NAME` | bucket name when `imageUploadType` is set to `s3` or `minio` |
| `sourceURL` | `https://github.com/hackmdio/codimd/tree/<current commit>` | Provides the link to the source code of CodiMD on the entry page (Please, make sure you change this when you run a modified version) |

<sup>1</sup>: relative paths are based on CodiMD's base directory

## Third-party integration API key settings

| service | settings location | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, gitlab, mattermost, dropbox, google, ldap, saml | environment variables or `config.json` | for signin |
| imgur, s3, minio, azure | environment variables or `config.json` | for image upload |
| dropbox(`dropbox/appKey`) | `config.json` | for export and import |

## Third-party integration OAuth callback URLs

| service | callback URL (after the server URL) |
| ------- | --------- |
| facebook | `/auth/facebook/callback` |
| twitter | `/auth/twitter/callback` |
| github | `/auth/github/callback` |
| gitlab | `/auth/gitlab/callback` |
| mattermost | `/auth/mattermost/callback` |
| dropbox | `/auth/dropbox/callback` |
| google | `/auth/google/callback` |
| saml | `/auth/saml/callback` |

# Developer Notes

## Structure

```text
codimd/
├── tmp/            --- temporary files
├── docs/           --- document files
├── lib/            --- server libraries
└── public/         --- client files
    ├── css/        --- css styles
    ├── js/         --- js scripts
    ├── vendor/     --- vendor includes
    └── views/      --- view templates
```

## Operational Transformation

From 0.3.2, we started supporting operational transformation.
It makes concurrent editing safe and will not break up other users' operations.
Additionally, now can show other clients' selections.
See more at [http://operational-transformation.github.io/](http://operational-transformation.github.io/)



# License

**License under AGPL.**

[gitter-image]: https://img.shields.io/badge/gitter-hackmdio/codimd-blue.svg
[gitter-url]: https://gitter.im/hackmdio/hackmd
[travis-image]: https://travis-ci.org/hackmdio/codimd.svg?branch=master
[travis-url]: https://travis-ci.org/hackmdio/codimd
[github-version-badge]: https://img.shields.io/github/release/hackmdio/codimd.svg
[github-release-page]: https://github.com/hackmdio/codimd/releases
[github-release-feed]: https://github.com/hackmdio/codimd/releases.atom
[poeditor-image]: https://img.shields.io/badge/POEditor-translate-blue.svg
[poeditor-url]: https://poeditor.com/join/project/q0nuPWyztp
