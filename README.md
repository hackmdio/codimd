HackMD
===

[![Join the chat at https://gitter.im/hackmdio/hackmd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

HackMD is a realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, but more focusing on speed and flexibility.  
Still in early stage, feel free to fork or contribute to this.

Thanks for your using! :smile:

Browsers Requirement
---
- Chrome >= 45, Chrome for Android >= 47
- Safari >= 9, iOS Safari >= 8.4
- Firefox >= 44
- IE >= 9, Edge >= 12
- Opera >= 34, Opera Mini not supported
- Android Browser >= 4.4

Prerequisite
---
- Node.js 4.x or up (test up to 5.8.0)
- PostgreSQL 9.3.x or 9.4.x
- MongoDB 3.0.x
- npm and bower

Get started
---
1. Download a release and unzip or clone into a directory
2. Enter the directory and type `npm install && bower install`, will install all the dependencies
3. Install PostgreSQL and MongoDB (yes, currently we need both)
4. Import database schema, see more on below
5. Setup the configs, see more on below
6. Setup environment variables, which will overwrite the configs
7. Run the server as you like (node, forever, pm2)

Import database schema
---
The notes are store in PostgreSQL, the schema is in the `hackmd_schema.sql`  
To import the sql file in PostgreSQL, see http://www.postgresql.org/docs/9.4/static/backup-dump.html

The users, temps and sessions are store in MongoDB, which don't need schema, so just make sure you have the correct connection string.

Structure
---
```
hackmd/
├── tmp/			--- temporary files
├── lib/			--- server libraries
└── public/			--- client files
	├── css/		--- css styles
	├── js/			--- js scripts
	├── vendor/		--- vendor includes
	└── views/		--- view templates
```

Configuration files
---
There are some config you need to change in below files
```
./config.js				--- for server settings
./public/js/index.js	--- for client settings
./public/js/common.js	--- for client settings
```

Client-side index.js settings
---
| variables | example values | description |
| --------- | ------ | ----------- |
| debug | `true` or `false` | set debug mode, show more logs |
| version | `0.3.2` | current version, must match same var in server side `config.js` |

Client-side common.js settings
---
| variables | example values | description |
| --------- | ------ | ----------- |
| domain | `localhost` | domain name |
| urlpath | `hackmd` | sub url path, like: `www.example.com/<urlpath>` |

Environment variables
---
| variables | example values | description |
| --------- | ------ | ----------- |
| NODE_ENV  | `production` or `development` | show current environment status |
| DATABASE_URL | `postgresql://user:pass@host:port/hackmd` | PostgreSQL connection string |
| MONGOLAB_URI | `mongodb://user:pass@host:port/hackmd` | MongoDB connection string |
| PORT | `80` | web port |
| SSLPORT | `443` | ssl web port |
| DOMAIN | `localhost` | domain name |
| URL_PATH | `hackmd` | sub url path, like `www.example.com/<URL_PATH>` |

Server-side config.js settings
---
| variables | example values | description |
| --------- | ------ | ----------- |
| testport  | `3000` | debug web port, fallback to this when not set in environment |
| testsslport | `3001` | debug web ssl port, fallback to this when not set in environment |
| usessl | `true` or `false` | set to use ssl |
| protocolusessl | `true` or `false` | set to use ssl protocol |
| urladdport | `true` or `false` | set to add port on oauth callback url |
| debug | `true` or `false` | set debug mode, show more logs |
| usecdn | `true` or `false` | set to use CDN resources or not |
| version | `0.3.2` | currnet version, must match same var in client side `index.js` |
| alloworigin | `['localhost']` | domain name whitelist |
| sslkeypath | `./cert/client.key` | ssl key path |
| sslcertpath | `./cert/hackmd_io.crt` | ssl cert path |
| sslcapath | `['./cert/COMODORSAAddTrustCA.crt']` | ssl ca chain |
| dhparampath | `./cert/dhparam.pem` | ssl dhparam path |
| tmppath | `./tmp/` | temp file path |
| postgresqlstring | `postgresql://user:pass@host:port/hackmd` | PostgreSQL connection string, fallback to this when not set in environment |
| mongodbstring | `mongodb://user:pass@host:port/hackmd` | MongoDB connection string, fallback to this when not set in environment |
| sessionname | `connect.sid` | cookie session name |
| sessionsecret | `secret` | cookie session secret |
| sessionlife | `14 * 24 * 60 * 60 * 1000` | cookie session life |
| sessiontouch | `1 * 3600` | cookie session touch |
| heartbeatinterval | `5000` | socket.io heartbeat interval |
| heartbeattimeout | `10000` | socket.io heartbeat timeout |
| documentmaxlength | `100000` | note max length |

Third-party integration api key settings
---
| service | file path | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, dropbox | `config.js` | for signin |
| imgur | `config.js` | for image upload |
| dropbox | `public/views/foot.ejs` | for chooser and saver |
| google drive | `public/js/common.js` | for export and import |

Operational Transformation
---
From 0.3.2, we start support operational transformation.  
Which make concurrent editing safe and not break up other users' operations.  
Even more, now can show other clients' selections.  
See more at http://operational-transformation.github.io/

**License under MIT.**
