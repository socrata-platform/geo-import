# geo-import

## what
import
* geojson

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

`./test.sh` will watch your tests and re-run on changes

`npm test` will run them in one shot
