HackMD 0.3.2
===

HackMD is a realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, but more focusing on speed and flexibility.  
Still in early stage, feel free to fork or contribute to this.

Thanks for your using! :smile:

Operational Transformation
---
From 0.3.2, we start support operational transformation.
Which make concurrent editing safe and not break up other users' operations.
Even more, now can show other clients' selections.

Database dependency
---
- PostgreSQL 9.3.6 or 9.4.1
- MongoDB 3.0.2

Import database schema
---
The notes are store in PostgreSQL, the schema is in the `hackmd_schema.sql`  
To import the sql file in PostgreSQL, type `psql -i hackmd_schema.sql`

The users, temps and sessions are store in MongoDB, which don't need schema, so just make sure you have the correct connection string.

Structure
---
```
hackmd/
├── logs/			--- server logs
├── backups/		--- db backups
├── tmp/			--- temporary files
├── lib/			--- server libraries
└── public/			--- client files
	├── css/		--- css styles
	├── js/			--- js scripts
	├── vendor/		--- vendor includes
	└── views/		--- view templates
```

Configure
---
There are some config you need to change in below files
```
./Procfile				--- for heroku start
./run.sh				--- for forever start
./processes.json		--- for pm2 start
./config.js				--- for server settings
./public/js/common.js	--- for client settings
./hackmd				--- for logrotate
```

**From 0.3.1, we no longer recommend using `forever` to run your server.**

We using `pm2` to run server.  
See [here](https://github.com/Unitech/pm2) for details.

You can use SSL to encrypt your site by passing certificate path in the `config.js` and set `usessl=true`

Run a server
---
 - forever: `bash run.sh`
 - pm2: `pm2 start processes.json`

Stop a server
---
 - forever: `forever stop hackmd`
 - pm2: `pm2 stop hackmd`

Backup db
---
To backup the db, type `bash backup.sh`

**License under MIT.**
