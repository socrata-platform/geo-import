#!/bin/bash

# Simple thing to watch your project and run tests on change
# Takes one optional argument, which will grep tests and run the ones that match

while inotifywait -r -e modify ./lib ./test; do
  if [ -z "$1" ]
  then
    GEO_IMPORT_ENV=test ./node_modules/.bin/mocha --compilers js:babel/register
  else
    echo "Running tests that match $1"
    GEO_IMPORT_ENV=test ./node_modules/.bin/mocha -g "$1" --compilers js:babel/register
  fi
done
