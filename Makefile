lib: es6-lib node_modules
	mkdir -p lib
	node_modules/.bin/babel es6-lib --out-dir lib

test: lib
	mkdir -p test
	node_modules/.bin/babel es6-test --out-dir test
	rm -f test/fixtures
	ln -sf $(CURDIR)/es6-test/fixtures  test/fixtures
	GEO_IMPORT_ENV=test ./node_modules/.bin/mocha test/unit test/smoke && jshint es6-lib

appease_jenkins: lib
	tar -zcvf lib.tar lib/


node_modules/node-srs:


node_modules:
	npm i

clean:
	rm -rf lib
	rm -rf test
	rm -f lib.tar
.PHONY: clean test
