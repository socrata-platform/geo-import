#!/bin/bash
if [ \"$NODE_ENV\" != production ] ; then
  if [ ! -d "../node-srs" ]; then
    git clone https://github.com/rozap/node-srs ../node-srs
  fi
  pushd ../node-srs
  rm -r node_modules
  CC=gcc CXX=g++ npm install
  popd
  ln -s $(pwd)/../node-srs node_modules/node-srs
fi