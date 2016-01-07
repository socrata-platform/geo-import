#!/usr/bin/env node --harmony

'use strict';

var Mocha = require('mocha');
var childProcess = require('child_process');
var fs = require('fs');
var jsonfile = require('jsonfile');
var packageInfo = require('../package.json');
var path = require('path');
var prompt = require('prompt');
var spawn = require('child_process').spawn;

jsonfile.spaces = 2;

prompt.colors = false;
prompt.message = '';
prompt.delimiter = '';
prompt.start();

var curVersion = packageInfo.version;
var defaultRelease = curVersion.replace(/-SNAPSHOT$/, '');

if (curVersion === defaultRelease) {
  throw new Error('Not a SNAPSHOT version!');
}


function doRelease() {
  var packagePath = path.resolve(__dirname, '..', 'package.json');

  prompt.get({
    properties: {
      releaseVersion: {
        description: 'Release version [' + defaultRelease + ']: ',
        pattern: /[0-9]+[.][0-9]+[.][0-9]/
      }
    }
  }, function(err, result) {
    if (err) {
      throw err;
    }

    var releaseVersion = result.releaseVersion || defaultRelease;
    var splitVersion = releaseVersion.split('.').map(function(s) {
      return parseInt(s, 10);
    });

    splitVersion[2] += 1;
    var defaultNext = splitVersion.join('.') + '-SNAPSHOT';

    prompt.get({
      properties: {
        nextVersion: {
          description: 'Next version[' + defaultNext + ']:',
          pattern: /[0-9]+[.][0-9]+[.][0-9]-SNAPSHOT/
        }
      }
    }, function(nErr, nResult) {
      if (err) {
        throw err;
      }

      var nextVersion = nResult.nextVersion || defaultNext;

      packageInfo.version = releaseVersion;
      jsonfile.writeFileSync(packagePath, packageInfo);

      childProcess.execSync('git add ' + packagePath);
      childProcess.execSync('git commit -m "Setting version to ' +
        releaseVersion +
        '"');
      childProcess.execSync('git tag v' + releaseVersion);

      packageInfo.version = nextVersion;
      jsonfile.writeFileSync(packagePath, packageInfo);

      childProcess.execSync('git add ' + packagePath);
      childProcess.execSync('git commit -m "Setting version to ' +
        nextVersion +
        '"');
      prompt.get({
        properties: {
          doPush: {
            description: 'Push changes to the remote repository (y/n)? ' + '[y]:'
          }
        }
      }, function(pErr, pResult) {
        if (pErr) {
          throw pErr;
        }

        if (pResult.doPush.toLowerCase() === 'y') {
          console.log('pushing changes...');
          childProcess.execSync('git push', {stdio: 'inherit'});
          childProcess.execSync('git push --tags', {stdio: 'inherit'});
          console.log('Done.');
        }
      });
    });
  });
}

var test = spawn('npm', ['test'], {cwd: __dirname + '/..', stdio: 'inherit'});
test.on('close', function(code) {
  if (code !== 0) throw new Error("Exited with code " + code);
  doRelease();
});
