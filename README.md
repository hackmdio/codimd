HackMD Community Edition
===

[![Standard - JavaScript Style Guide][standardjs-image]][standardjs-url]

[![Join the chat at https://gitter.im/hackmdio/hackmd][gitter-image]][gitter-url]
[![#HackMD on matrix.org][matrix.org-image]][matrix.org-url]
[![build status][travis-image]][travis-url]
[![version][github-version-badge]][github-release-page]
[![Help Contribute to Open Source][codetriage-image]][codetriage-url]
[![POEditor][poeditor-image]][poeditor-url]

HackMD lets you create realtime collaborative markdown notes on all platforms.
Inspired by Hackpad, with more focus on speed and flexibility.
Still in the early stage, feel free to fork or contribute to HackMD.

Thanks for using! :smile:

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Table of Contents

- [Browsers Requirement](#browsers-requirement)
- [Installation](#installation)
  - [Getting started (Native install)](#getting-started-native-install)
    - [Prerequisite](#prerequisite)
    - [Instructions](#instructions)
  - [CentOS Installation](docs/guides/centos-installation.sh)
  - [Heroku Deployment](#heroku-deployment)
  - [HackMD by docker container](#hackmd-by-docker-container)
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

- Node.js 6.x or up (test up to 7.5.0)
- Database (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL) use charset `utf8`
- npm (and its dependencies, especially [uWebSockets](https://github.com/uWebSockets/uWebSockets#nodejs-developers), [node-gyp](https://github.com/nodejs/node-gyp#installation))
- For **building** HackMD we recommend to use a machine with at least **2GB** RAM

### Instructions

1. Download a release and unzip or clone into a directory
2. Enter the directory and type `bin/setup`, which will install npm dependencies and create configs. The setup script is written in Bash, you would need bash as a prerequisite.
3. Setup the configs, see more below
4. Setup environment variables which will overwrite the configs
5. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
6. Run the server as you like (node, forever, pm2)

## Heroku Deployment

You can quickly setup a sample Heroku HackMD application by clicking the button below.

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/hackmdio/hackmd/tree/master)

If you deploy it without the button, keep in mind to use the right buildpacks. For details check `app.json`.

## HackMD by docker container
[![Try in PWD](https://cdn.rawgit.com/play-with-docker/stacks/cff22438/assets/images/button.png)](http://play-with-docker.com?stack=https://github.com/hackmdio/docker-hackmd/raw/master/docker-compose.yml&stack_name=hackmd)


**Debian-based version:**

[![latest](https://images.microbadger.com/badges/version/hackmdio/hackmd:latest.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/hackmdio/hackmd:latest.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own image badge on microbadger.com")


**Alpine-based version:**

[![alpine](https://images.microbadger.com/badges/version/hackmdio/hackmd:alpine.svg)](https://microbadger.com/images/hackmdio/hackmd:alpine "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/hackmdio/hackmd:alpine.svg)](https://microbadger.com/images/hackmdio/hackmd:alpine "Get your own image badge on microbadger.com")

The easiest way to setup HackMD using docker are using the following three commands:

```console
git clone https://github.com/hackmdio/docker-hackmd.git
cd docker-hackmd
docker-compose up
```
Read more about it in the [docker repository…](https://github.com/hackmdio/docker-hackmd)

# Upgrade

## Native setup

If you are upgrading HackMD from an older version, follow these steps:

1. Fully stop your old server first (important)
2. `git pull` or do whatever that updates the files
3. `npm install` to update dependencies
4. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
5. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string
   For example: `postgres://username:password@localhost:5432/hackmd`
6. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema
7. Start your whole new server!


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
| `HMD_DOMAIN` | `hackmd.io` | domain name |
| `HMD_URL_PATH` | `hackmd` | sub URL path, like `www.example.com/<URL_PATH>` |
| `HMD_PORT` | `80` | web app port |
| `HMD_ALLOW_ORIGIN` | `localhost, hackmd.io` | domain name whitelist (use comma to separate) |
| `HMD_PROTOCOL_USESSL` | `true` or `false` | set to use SSL protocol for resources path (only applied when domain is set) |
| `HMD_URL_ADDPORT` | `true` or `false` | set to add port on callback URL (ports `80` or `443` won't be applied) (only applied when domain is set) |
| `HMD_USECDN` | `true` or `false` | set to use CDN resources or not (default is `true`) |
| `HMD_ALLOW_ANONYMOUS` | `true` or `false` | set to allow anonymous usage (default is `true`) |
| `HMD_ALLOW_ANONYMOUS_EDITS` | `true` or `false` | if `allowAnonymous` is `true`, allow users to select `freely` permission, allowing guests to edit existing notes (default is `false`) |
| `HMD_ALLOW_FREEURL` | `true` or `false` | set to allow new note creation by accessing a nonexistent note URL |
| `HMD_DEFAULT_PERMISSION` | `freely`, `editable`, `limited`, `locked` or `private` | set notes default permission (only applied on signed users) |
| `HMD_DB_URL` | `mysql://localhost:3306/database` | set the database URL |
| `HMD_SESSION_SECRET` | no example | Secret used to sign the session cookie. If non is set, one will randomly generated on startup |
| `HMD_SESSION_LIFE` | `1209600000` | Session life time. (milliseconds) |
| `HMD_FACEBOOK_CLIENTID` | no example | Facebook API client id |
| `HMD_FACEBOOK_CLIENTSECRET` | no example | Facebook API client secret |
| `HMD_TWITTER_CONSUMERKEY` | no example | Twitter API consumer key |
| `HMD_TWITTER_CONSUMERSECRET` | no example | Twitter API consumer secret |
| `HMD_GITHUB_CLIENTID` | no example | GitHub API client id |
| `HMD_GITHUB_CLIENTSECRET` | no example | GitHub API client secret |
| `HMD_GITLAB_SCOPE` | `read_user` or `api` | GitLab API requested scope (default is `api`) (GitLab snippet import/export need `api` scope) |
| `HMD_GITLAB_BASEURL` | no example | GitLab authentication endpoint, set to use other endpoint than GitLab.com (optional) |
| `HMD_GITLAB_CLIENTID` | no example | GitLab API client id |
| `HMD_GITLAB_CLIENTSECRET` | no example | GitLab API client secret |
| `HMD_MATTERMOST_BASEURL` | no example | Mattermost authentication endpoint |
| `HMD_MATTERMOST_CLIENTID` | no example | Mattermost API client id |
| `HMD_MATTERMOST_CLIENTSECRET` | no example | Mattermost API client secret |
| `HMD_DROPBOX_CLIENTID` | no example | Dropbox API client id |
| `HMD_DROPBOX_CLIENTSECRET` | no example | Dropbox API client secret |
| `HMD_GOOGLE_CLIENTID` | no example | Google API client id |
| `HMD_GOOGLE_CLIENTSECRET` | no example | Google API client secret |
| `HMD_LDAP_URL` | `ldap://example.com` | URL of LDAP server |
| `HMD_LDAP_BINDDN` | no example | bindDn for LDAP access |
| `HMD_LDAP_BINDCREDENTIALS` | no example | bindCredentials for LDAP access |
| `HMD_LDAP_SEARCHBASE` | `o=users,dc=example,dc=com` | LDAP directory to begin search from |
| `HMD_LDAP_SEARCHFILTER` | `(uid={{username}})` | LDAP filter to search with |
| `HMD_LDAP_SEARCHATTRIBUTES` | `displayName, mail` | LDAP attributes to search with (use comma to separate) |
| `HMD_LDAP_USERIDFIELD` | `uidNumber` or `uid` or `sAMAccountName` | The LDAP field which is used uniquely identify a user on HackMD |
| `HMD_LDAP_USERNAMEFIELD` | Fallback to userid | The LDAP field which is used as the username on HackMD |
| `HMD_LDAP_TLS_CA` | `server-cert.pem, root.pem` | Root CA for LDAP TLS in PEM format (use comma to separate) |
| `HMD_LDAP_PROVIDERNAME` | `My institution` | Optional name to be displayed at login form indicating the LDAP provider |
| `HMD_SAML_IDPSSOURL` | `https://idp.example.com/sso` | authentication endpoint of IdP. for details, see [guide](docs/guides/auth.md#saml-onelogin). |
| `HMD_SAML_IDPCERT` | `/path/to/cert.pem` | certificate file path of IdP in PEM format |
| `HMD_SAML_ISSUER` | no example | identity of the service provider (optional, default: serverurl)" |
| `HMD_SAML_IDENTIFIERFORMAT` | no example | name identifier format (optional, default: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`) |
| `HMD_SAML_GROUPATTRIBUTE` | `memberOf` | attribute name for group list (optional) |
| `HMD_SAML_REQUIREDGROUPS` | `Hackmd-users` | group names that allowed (use vertical bar to separate) (optional) |
| `HMD_SAML_EXTERNALGROUPS` | `Temporary-staff` | group names that not allowed (use vertical bar to separate) (optional) |
| `HMD_SAML_ATTRIBUTE_ID` | `sAMAccountName` | attribute map for `id` (optional, default: NameID of SAML response) |
| `HMD_SAML_ATTRIBUTE_USERNAME` | `mailNickname` | attribute map for `username` (optional, default: NameID of SAML response) |
| `HMD_SAML_ATTRIBUTE_EMAIL` | `mail` | attribute map for `email` (optional, default: NameID of SAML response if `HMD_SAML_IDENTIFIERFORMAT` is default) |
| `HMD_IMGUR_CLIENTID` | no example | Imgur API client id |
| `HMD_EMAIL` | `true` or `false` | set to allow email signin |
| `HMD_ALLOW_PDF_EXPORT` | `true` or `false` | Enable or disable PDF exports |
| `HMD_ALLOW_EMAIL_REGISTER` | `true` or `false` | set to allow email register (only applied when email is set, default is `true`. Note `bin/manage_users` might help you if registration is `false`.) |
| `HMD_IMAGE_UPLOAD_TYPE` | `imgur`, `s3`, `minio` or `filesystem` | Where to upload image. For S3, see our Image Upload Guides for [S3](docs/guides/s3-image-upload.md) or [Minio](docs/guides/minio-image-upload.md) |
| `HMD_S3_ACCESS_KEY_ID` | no example | AWS access key id |
| `HMD_S3_SECRET_ACCESS_KEY` | no example | AWS secret key |
| `HMD_S3_REGION` | `ap-northeast-1` | AWS S3 region |
| `HMD_S3_BUCKET` | no example | AWS S3 bucket name |
| `HMD_MINIO_ACCESS_KEY` | no example | Minio access key |
| `HMD_MINIO_SECRET_KEY` | no example | Minio secret key |
| `HMD_MINIO_ENDPOINT` | `minio.example.org` | Address of your Minio endpoint/instance |
| `HMD_MINIO_PORT` | `9000` | Port that is used for your Minio instance |
| `HMD_MINIO_SECURE` | `true` | If set to `true` HTTPS is used for Minio |
| `HMD_HSTS_ENABLE` | ` true`  | set to enable [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) if HTTPS is also enabled (default is ` true`) |
| `HMD_HSTS_INCLUDE_SUBDOMAINS` | `true` | set to include subdomains in HSTS (default is `true`) |
| `HMD_HSTS_MAX_AGE` | `31536000` | max duration in seconds to tell clients to keep HSTS status (default is a year) |
| `HMD_HSTS_PRELOAD` | `true` | whether to allow preloading of the site's HSTS status (e.g. into browsers) |
| `HMD_CSP_ENABLE` | `true` | whether to enable Content Security Policy (directives cannot be configured with environment variables) |
| `HMD_CSP_REPORTURI` | `https://<someid>.report-uri.com/r/d/csp/enforce` | Allows to add a URL for CSP reports in case of violations |

## Application settings `config.json`

| variables | example values | description |
| --------- | ------ | ----------- |
| `debug` | `true` or `false` | set debug mode, show more logs |
| `domain` | `localhost` | domain name |
| `urlPath` | `hackmd` | sub URL path, like `www.example.com/<urlpath>` |
| `port` | `80` | web app port |
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
| `defaultPermission` | `freely`, `editable`, `limited`, `locked`, `protected` or `private` | set notes default permission (only applied on signed users) |
| `dbURL` | `mysql://localhost:3306/database` | set the db URL; if set, then db config (below) won't be applied |
| `db` | `{ "dialect": "sqlite", "storage": "./db.hackmd.sqlite" }` | set the db configs, [see more here](http://sequelize.readthedocs.org/en/latest/api/sequelize/) |
| `sslKeyPath` | `./cert/client.key` | SSL key path (only need when you set `useSSL`) |
| `sslCertPath` | `./cert/hackmd_io.crt` | SSL cert path (only need when you set `useSSL`) |
| `sslCAPath` | `['./cert/COMODORSAAddTrustCA.crt']` | SSL ca chain (only need when you set `useSSL`) |
| `dhParamPath` | `./cert/dhparam.pem` | SSL dhparam path (only need when you set `useSSL`) |
| `tmpPath` | `./tmp/` | temp directory path |
| `defaultNotePath` | `./public/default.md` | default note file path |
| `docsPath` | `./public/docs` | docs directory path |
| `indexPath` | `./public/views/index.ejs` | index template file path |
| `hackmdPath` | `./public/views/hackmd.ejs` | hackmd template file path |
| `errorPath` | `./public/views/error.ejs` | error template file path |
| `prettyPath` | `./public/views/pretty.ejs` | pretty template file path |
| `slidePath` | `./public/views/slide.hbs` | slide template file path |
| `sessionName` | `connect.sid` | cookie session name |
| `sessionSecret` | `secret` | cookie session secret |
| `sessionLife` | `14 * 24 * 60 * 60 * 1000` | cookie session life |
| `staticCacheTime` | `1 * 24 * 60 * 60 * 1000` | static file cache time |
| `heartbeatInterval` | `5000` | socket.io heartbeat interval |
| `heartbeatTimeout` | `10000` | socket.io heartbeat timeout |
| `documentMaxLength` | `100000` | note max length |
| `email` | `true` or `false` | set to allow email signin |
| `allowEmailRegister`  | `true` or `false` | set to allow email register (only applied when email is set, default is `true`. Note `bin/manage_users` might help you if registration is `false`.) |
| `imageUploadType` | `imgur`(default), `s3`, `minio` or `filesystem` | Where to upload image
| `minio` | `{ "accessKey": "YOUR_MINIO_ACCESS_KEY", "secretKey": "YOUR_MINIO_SECRET_KEY", "endpoint": "YOUR_MINIO_HOST", port: 9000, secure: true }` | When `imageUploadType` is set to `minio`, you need to set this key. Also checkout our [Minio Image Upload Guide](docs/guides/minio-image-upload.md) |
| `s3` | `{ "accessKeyId": "YOUR_S3_ACCESS_KEY_ID", "secretAccessKey": "YOUR_S3_ACCESS_KEY", "region": "YOUR_S3_REGION" }` | When `imageuploadtype` be set to `s3`, you would also need to setup this key, check our [S3 Image Upload Guide](docs/guides/s3-image-upload.md) |
| `s3bucket` | `YOUR_S3_BUCKET_NAME` | bucket name when `imageUploadType` is set to `s3` or `minio` |

## Third-party integration API key settings

| service | settings location | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, gitlab, mattermost, dropbox, google, ldap, saml | environment variables or `config.json` | for signin |
| imgur, s3, minio | environment variables or `config.json` | for image upload |
| google drive(`google/apiKey`, `google/clientID`), dropbox(`dropbox/appKey`) | `config.json` | for export and import |

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
hackmd/
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

[gitter-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[matrix.org-image]: https://img.shields.io/badge/Matrix.org-%23HackMD@matrix.org-green.svg
[matrix.org-url]: https://riot.im/app/#/room/#hackmd:matrix.org
[travis-image]: https://travis-ci.org/hackmdio/hackmd.svg?branch=master
[travis-url]: https://travis-ci.org/hackmdio/hackmd
[github-version-badge]: https://img.shields.io/github/release/hackmdio/hackmd.svg
[github-release-page]: https://github.com/hackmdio/hackmd/releases
[standardjs-image]: https://cdn.rawgit.com/feross/standard/master/badge.svg
[standardjs-url]: https://github.com/feross/standard
[codetriage-image]: https://www.codetriage.com/hackmdio/hackmd/badges/users.svg
[codetriage-url]: https://www.codetriage.com/hackmdio/hackmd
[poeditor-image]: https://img.shields.io/badge/POEditor-translate-blue.svg
[poeditor-url]: https://poeditor.com/join/project/1OpGjF2Jir
