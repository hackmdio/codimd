#!/usr/bin/env bash

set -euo pipefail
set -x

CURRENT_DIR=$(dirname "$BASH_SOURCE")

GIT_SHA1="$(git rev-parse HEAD)"
GIT_SHORT_ID="${GIT_SHA1:0:8}"
GIT_TAG=$(git describe --exact-match --tags $(git log -n1 --pretty='%h') 2>/dev/null || echo "")

DOCKER_TAG="${GIT_TAG:-$GIT_SHORT_ID}"

docker build --build-arg RUNTIME=hackmdio/runtime:node-10-d27854ef -t "hackmdio/hackmd:$DOCKER_TAG" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."

docker build --build-arg RUNTIME=hackmdio/runtime:node-10-cjk-d27854ef -t "hackmdio/hackmd:$DOCKER_TAG-cjk" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."
