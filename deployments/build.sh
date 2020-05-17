#!/usr/bin/env bash

CURRENT_DIR=$(dirname "$BASH_SOURCE")

GIT_SHA1="$(git rev-parse HEAD)"
GIT_SHORT_ID="${SHA1:0:8}"
GIT_TAG=$(git describe --exact-match --tags $(git log -n1 --pretty='%h'))

DOCKER_TAG="${GIT_TAG:-$GIT_SHORT_ID}"

docker build -t "hackmdio/codimd:$DOCKER_TAG" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."

docker build --build-arg RUNTIME=node-10-cjk-0baafb79 -t "hackmdio/codimd:$DOCKER_TAG-cjk" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."
