# geo-import

## what
import
* geojson
* kmz
* kml


into soda-fountain


## setup

install dependencies
```
  npm install
```

this also runs a postinstall script to install mapbox/node-srs,
which is built from source in a sibling repo and symlinked here

## developing

run the development configuration using
```
GEO_IMPORT_ENV=dev babel-node lib/index.js
```
you will need core and the soda2 stack running

## testing

`./test.sh` will watch your tests and re-run the tests tagged as unit tests. If you want your tests to be run continuously, they need to have unit in the description.

Smoke tests are tests on real datasets that will take considerably longer to run, so you don't
want to be running them when developing. If you want to add a smoke test, tag it as `smoke`.
To run only the smoke tests:

`GEO_IMPORT_ENV=test ./node_modules/.bin/mocha -g "smoke" --compilers js:babel/register`

and then go get a cup of coffee



`npm test` will run them in one shot
