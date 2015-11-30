if [ ! -d "../node-srs" ]; then
  git clone https://github.com/mapbox/node-srs ../node-srs
fi
pushd ../node-srs
echo $(pwd)
rm -r node_modules
nvm use 0.12
CC=gcc CXX=g++ npm install --build-from-source
popd
# ln -s $(pwd)/../node-srs node_modules/node-srs
