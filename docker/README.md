# geo-import docker config #

## Requested Environment Variables ##
* `ZOOKEEPER_ENSEMBLE` The zookeeper cluster to talk to, in the form of ["0.0.0.0:2181", "0.0.0.0:2818"]

## Building ##
To build the image, run:
```
cp -r ../lib ../scripts ../package.json .
docker build -t geo-import .
```

Or, if you want to replace old versions:
```
cp ../lib ../scripts ../package.json
docker build --rm -t geo-import .
```

## Running ##
if the ip for lxcbr0 is is `10.0.3.1`, and I wanted to run the container connected to
my local ZK instance, i would run
```
docker run -p 4444:4444 -e 'ZOOKEEPER_ENSEMBLE=["10.0.3.1:2181"]' geo-import
```
