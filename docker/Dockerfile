FROM socrata/runit

RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get -y install nodejs npm
RUN npm install -g n
RUN n 5.12.0
RUN n use 5.12.0

# LABEL must be last for proper base image discoverability
LABEL repository.socrata/nodejs=""

ENV GEO_IMPORT_ENV=prod
ENV BABEL_DISABLE_CACHE=1
ENV SERVICE_DIR /etc/service/geo-import
ENV ROOT_DIR /srv/geo-import

EXPOSE 4445
# Need git and gdal for node-srs
RUN apt-get -y update && apt-get install -y git gdal-bin

COPY runit ${SERVICE_DIR}
WORKDIR ${ROOT_DIR}

# Add the stuff that makes up the base node app
ADD package.json ${ROOT_DIR}/
ADD scripts ${ROOT_DIR}/scripts
ADD lib.tar ${ROOT_DIR}

# Add geo-import specific metrics
# This next thing is broken, but only in fedramp-prod
# COPY collectd-nodejs.conf /etc/collectd/conf.d/nodejs.conf


# Passing --production prevents node-srs from installing.
# We will set it up sans symlinks in the next step
RUN npm install --production

# Do the annoying node-srs thing
WORKDIR ${ROOT_DIR}/node_modules
RUN git clone https://github.com/rozap/node-srs
WORKDIR ${ROOT_DIR}/node_modules/node-srs
RUN CC=gcc CXX=g++ npm install

WORKDIR ${ROOT_DIR}

RUN date -u +"%Y-%m-%dT%H:%M:%SZ" > build-time.txt
