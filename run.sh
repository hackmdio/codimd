#!/bin/bash
forever stop hackmd
DATABASE_URL='change this' \
MONGOLAB_URI='change this' \
PORT='80' \
SSLPORT='443' \
DOMAIN='change this' \
forever -a --uid hackmd start app.js