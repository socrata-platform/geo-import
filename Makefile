lib: es6-lib node_modules
	mkdir -p lib
	node_modules/.bin/babel es6-lib --out-dir lib

test: lib
	GEO_IMPORT_ENV=test ./node_modules/.bin/mocha es6-test/unit es6-test/smoke --require @babel/register && jshint es6-lib

appease_jenkins: lib
	tar -zcvf lib.tar lib/

translations: lib
	mkdir -p translations
	node lib/tasks/translations.js > translations/en.yml

node_modules:
	npm set progress=false # this makes npm twice as fast ;_;
	npm i

clean:
	rm -rf lib
	rm -rf test
	rm -f lib.tar
	rm -rf translations
	rm -rf node_modules

docker: appease_jenkins
	cp lib.tar docker/
	cp package.json docker/
	cd docker && sudo docker build .


.PHONY: clean test translations docker
