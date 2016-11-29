# geo-import

## what
import
* geojson
* kmz
* kml
* shp


into soda-fountain


## setup

### use the correct node version

Ensure that you have the correct version of Node.js, specified at `.node-version`, installed.

Use `n` or `nvm` to make this easy. `bin/start.sh` will automatically do this step for you.

### install dependencies

linux
```
  make
```

mac
  * el capitan, run `make`
  * earlier OSX versions don't have the correct version of clang. Either update xcode (??) or add this [workaround](https://github.com/Homebrew/homebrew/issues/40653)

this also runs a postinstall script to install mapbox/node-srs,
which is built from source in a sibling repo and symlinked here

Note that `make clean` doesn't remove the dependency directory. If you run dependency resolution with the wrong version of node, you will need to `make clean && rm -r node_modules`, change node versions, and then `make` again.

### other services
because this does imports, you need [import-status-service](https://github.com/socrata/import-status-service) and ISS consumer running

you will also need AMQ running


## developing
to compile to es5, run
```
make
```
then run the development configuration using
```
GEO_IMPORT_ENV=dev node lib/index.js
```

To run it as es5

you will need core and the soda2 stack running

## testing

do a single, full test run with `npm test`

`./test.sh` will watch your tests and re-run the tests tagged as unit tests. If you want your tests to be run continuously, they need to be in the `test/unit` directory

Smoke tests are tests on real datasets that will take considerably longer to run, so you don't
want to be running them when developing. If you want to add a smoke test, add it to the `test/smoke` directory.

## using
Imports and replaces are passed on AMQ from core to geo-import


* we define `shapeblob` as one of {shape archive, kmz, kml, geojson}
* Content-Types
  * KML content-type must be application/vnd.google-earth.kml+xml
  * KMZ content-type must be application/vnd.google-earth.kmz
  * geoJSON content-type must be application/json
  * shapefile content-type must be application/zip


| Method | Endpoint   | Payload | Content-Type | Description              | Response |
| ------ | ---------- | ------- | ------------ |  ----------------------- | -------- |
| `GET`  | `/version` | `none`  | `anything `  | get the service version  | version as json |
| `POST` | `/summary` | `shapeblob` | must correspond to payload | create a summary of the blob | summary as json |
| `GET`  | `/heapdump`| `none` | `anything` | get a heap dump of the service | a heap dump to load into the chrome profiler |
## tasks

### translations
run `make translations` to get a `translations/en.yml` file. You can use this yaml in the rails frontend for i18n. This generates javascript style templates - because we'll probably be doing error handling in the react importer
