#!/bin/bash
forever stop hackmd
DATABASE_URL='change this' \
MONGOLAB_URI='change this' \
PORT='80' \
SSLPORT='443' \
DOMAIN='change this' \
forever -a --uid hackmd -l ./logs/hackmd_log.log -o ./logs/hackmd_out.log -e ./logs/hackmd_error.log start app.js