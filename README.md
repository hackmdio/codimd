HackMD 0.2.9
===

HackMD is a realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, but more focusing on speed and flexibility.  
Still in early stage, feel free to fork or contribute to this.  

Thanks for your using! :smile:

Dependency
---
- PostgreSQL 9.3.6 or 9.4.1
- MongoDB 3.0.2

Import db schema
---
The notes are store in PostgreSQL, the schema is in the `hackmd_schema.sql`  
To import the sql file in PostgreSQL, type `psql -i hackmd_schema.sql`

The users, temps and sessions are store in MongoDB, which don't need schema, so just make sure you have the correct connection string.  

Config
---
There are some config you need to change in below files
```
./run.sh
./config.js
./public/js/common.js
```

The script `run.sh`, it's for someone like me to run the server via npm package `forever`, and can passing environment variable to the server, like heroku does.

To install `forever`, just type `npm install forever -g`

You can use SSL to encrypt your site by passing certificate path in the `config.js` and set `usessl=true`

Run a server
---
To run the server, type `bash run.sh`  
Log will be at `~/.forever/hackmd.log`

Stop a server
---
To stop the server, simply type `forever stop hackmd`

Backup db
---
To backup the db, type `bash backup.sh`  
Backup files will be at `./backups/`


**License under MIT.**