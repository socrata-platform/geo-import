lib: es6-lib
	mkdir -p lib
	babel es6-lib --out-dir lib

test: lib
	mkdir -p test
	babel es6-test --out-dir test
	rm -f test/fixtures
	ln -s $(CURDIR)/es6-test/fixtures  test/fixtures
	GEO_IMPORT_ENV=test ./node_modules/.bin/mocha test/unit test/smoke

clean:
	rm -rf lib
	rm -rf test

.PHONY: clean test
