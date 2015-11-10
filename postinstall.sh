git clone https://github.com/mapbox/node-srs ../node-srs
pushd ../node-srs
# npm install --build-from-source
popd
ln -s $(pwd)/../node-srs node_modules/node-srs
