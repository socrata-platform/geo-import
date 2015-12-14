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

linux
```
  CC=gcc CXX=g++ npm i
```

mac
```
  ¯\_(ツ)_/¯
```
on a mac `npm i` *should* work, but i'm not sure how clang will deal with node-expat and node-srs, so brace yourself for some ugliness

this also runs a postinstall script to install mapbox/node-srs,
which is built from source in a sibling repo and symlinked here

## developing

run the development configuration using
```
GEO_IMPORT_ENV=dev node lib/index.js
```
you will need core and the soda2 stack running

## testing

do a single, full test run with `npm test`

`./test.sh` will watch your tests and re-run the tests tagged as unit tests. If you want your tests to be run continuously, they need to be in the `test/unit` directory

Smoke tests are tests on real datasets that will take considerably longer to run, so you don't
want to be running them when developing. If you want to add a smoke test, add it to the `test/smoke` directory.

## using

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
| `POST` | `/spatial` | `shapeblob` | must correspond to payload | create a new dataset | upsert result as json |
| `PUT`  | `/spatial/fbf0,fbf1,...,fbfn` | `shapeblob` | must correspond to payload | replace a dataset, where layers parsed from the dataset will replace the layer uuids passed in via the URL | upsert result as json |

