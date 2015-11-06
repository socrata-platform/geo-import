git clone https://github.com/mapbox/node-srs ../node-srs
pushd $(pwd)/../node-srs > /dev/null
npm install --build-from-source
popd > /dev/null
ln -s $(pwd)/../node-srs node_modules/node-srs
