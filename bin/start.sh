#!/bin/bash
set -e

make
~/.nvm/nvm.sh use 5.1
GEO_IMPORT_ENV=dev node lib/index.js
