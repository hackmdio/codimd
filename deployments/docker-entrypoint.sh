#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -gt 0 ]]; then
    exec "$@"
    exit $?
fi


# check database and redis is ready
if  [[ $CMD_DB_URL != "sqlite"* ]] ;
then
    pcheck -env CMD_DB_URL
fi

# Install sqlite3 if required
if [[ $CMD_DB_URL == "sqlite"* ]] ;
then
    echo "Installing sqlite3 package..."
    npm install -s sqlite3
fi

# run DB migrate
NEED_MIGRATE=${CMD_AUTO_MIGRATE:=true}

if [[ "$NEED_MIGRATE" = "true" ]] && [[ -f .sequelizerc ]] ; then
    npx sequelize db:migrate
fi

# start application
node app.js
