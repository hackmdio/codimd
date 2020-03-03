#!/bin/bash

set -euo pipefail

CMD_DB_URL="$DATABASE_URL" CMD_PORT="$PORT" npm run start
