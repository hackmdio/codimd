#!/usr/bin/env bash

set -eo pipefail
set -x

if [[ -z $1 || -z $2 ]];then
    echo "build.sh [runtime image] [buildpack image]"
    exit 1
fi

CURRENT_DIR=$(dirname "$BASH_SOURCE")

GIT_SHA1="$(git rev-parse HEAD)"
GIT_SHORT_ID="${GIT_SHA1:0:8}"
GIT_TAG=$(git describe --exact-match --tags $(git log -n1 --pretty='%h') 2>/dev/null || echo "")

DOCKER_TAG="${GIT_TAG:-$GIT_SHORT_ID}"

docker build --build-arg RUNTIME=$1 --build-arg BUILDPACK=$2 -t "hackmdio/hackmd:$DOCKER_TAG" -f "$CURRENT_DIR/Dockerfile" "$CURRENT_DIR/.."

