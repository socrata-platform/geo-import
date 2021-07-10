#!/bin/bash
set -e

make

node_version="`cat .node-version`"
if [ -n "`command -v nvm`" ]
then
  nvm install $node_version
  nvm use $node_version
else
  n $node_version
fi

GEO_IMPORT_ENV=dev ZOOKEEPER_ENSEMBLE="{}" node lib/index.js
