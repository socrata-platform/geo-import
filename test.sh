#!/bin/bash

# Simple thing to watch your project and run tests on change
# Takes one optional argument, which will grep tests and run the ones that match

while inotifywait -r -e modify ./es6-lib ./es6-test; do
  if [ -z "$1" ]
  then
    echo "Running unit tests"
    GEO_IMPORT_ENV=test ZOOKEEPER_ENSEMBLE="{}" ./node_modules/.bin/mocha es6-test/unit --require @babel/register
  else
    echo "Running tests that match $1"
    GEO_IMPORT_ENV=test ZOOKEEPER_ENSEMBLE="{}" ./node_modules/.bin/mocha es6-test/unit es6-test/smoke --grep "$1" --require @babel/register
  fi
  jshint es6-lib
done
