#!/bin/bash

set -euo pipefail

pcheck -constr "$CMD_DB_URL"

sequelize db:migrate

node app.js
