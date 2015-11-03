# geo-import

## what
import
* geojson

into soda-fountain


## setup

install some deps
```
  npm install
```

install the special snowflake
```
cd ../ && git clone https://github.com/mapbox/node-srs
cd node-srs
npm install --build-from-source
cd ../geo-import
cp -r ../node-srs node_modules
```

## developing

run the development configuration using
```
GEO_IMPORT_ENV=dev babel-node lib/index.js
```
you will need core and the soda2 stack running

## testing

`./test.sh` will watch your tests and re-run on changes

`npm test` will run them in one shot
