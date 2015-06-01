#!/bin/bash
path=./backups
today=$(date +"%Y%m%d")
timestamp=$(date +"%Y%m%d%H%M%S")
mkdir -p $path/$today
pg_dump hackmd > $path/$today/postgresql_$timestamp
mongodump -d hackmd -o $path/$today/mongodb_$timestamp