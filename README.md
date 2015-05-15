HackMD 0.2.8
===

This is a realtime collaborative markdown notes on all platforms.  
But still in early stage, feel free to fork or contribute to it.  

Thanks for your using!

There are some config you need to change in below files
```
./run.sh
./config.js
./public/js/common.js
```

You can use SSL to encrypt your site by passing certificate path in the `config.js` and set `usessl=true`.

And there is a script called `run.sh`, it's for someone like me to run the server via npm package `forever`, and can passing environment variable to the server, like heroku does.

To install `forever`, just type `npm install forever -g`

The notes are store in PostgreSQL, and I provided the schema in the `hackmd_schema.sql`.  
The users and sessions are store in mongoDB, which don't need schema, so just connect it directly.  

**License under MIT.**