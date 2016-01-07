FROM socrata/nodejs

ENV GEO_IMPORT_ENV=prod
ENV BABEL_DISABLE_CACHE=1
EXPOSE 4444
# Need git and gdal for node-srs
RUN apt-get -y update && apt-get install -y git gdal-bin

COPY ship.d /etc/ship.d/
WORKDIR /app

# Add the stuff that makes up the base node app
ADD package.json /app/
ADD scripts /app/scripts
ADD lib /app/lib


# Passing --production prevents node-srs from installing.
# We will set it up sans symlinks in the next step
RUN npm install --production

# Do the annoying node-srs thing
WORKDIR /app/node_modules
RUN git clone https://github.com/rozap/node-srs
WORKDIR /app/node_modules/node-srs
RUN CC=gcc CXX=g++ npm install

WORKDIR /app

RUN date -u +"%Y-%m-%dT%H:%M:%SZ" > build-time.txt
