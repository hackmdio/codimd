#!/bin/bash

set -euo pipefail

pcheck -constr "$HMD_DB_URL"

sequelize db:migrate

node app.js
