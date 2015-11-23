# geo-import

## what
import
* geojson
* kmz
* kml
* shp


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

do a single, full test run with `npm test`

`./test.sh` will watch your tests and re-run the tests tagged as unit tests. If you want your tests to be run continuously, they need to be in the `test/unit` directory

Smoke tests are tests on real datasets that will take considerably longer to run, so you don't
want to be running them when developing. If you want to add a smoke test, add it to the `test/smoke` directory.
