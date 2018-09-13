#!/bin/bash
set -e

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${THIS_DIR}/..

make

node_version="`cat .node-version`"
if [ -n "`command -v nvm`" ]; then
  nvm install $node_version
  nvm use $node_version
elif [ -n "`command -v n`" ]; then
  n $node_version
fi

GEO_IMPORT_ENV=dev node lib/index.js
