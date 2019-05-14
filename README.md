## LDD Tool - Web Service

The [Local Data Dictionary (LDD) Tool](https://pds.nasa.gov/tools/about/ldd/) parses a local data dictionary file and generates PDS4 data standard files. This repo provides a Docker image that is already configured to run `lddtool` with only a single dependency (Docker) and without any additional configuration required. 

#### Interfaces

The Docker container makes available the following interfaces:

* Web form ([http://localhost:3002](http://localhost:3002))
* API
    * `lddtool: POST`
        * Accepts ingest file as form data and responds with a compressed directory containing the artificats from LDD Tool and the original ingest file.

#### Dependencies

Ensure that you have Docker installed on your system. This application resolves the rest of its dependencies within the docker container.

* [Docker](https://www.docker.com/)

#### Deployment

```sh
$ ./scripts/docker.build.sh    # rebuilds docker image and starts a new docker container
```

By default, the application will be accessible at `http://localhost:3002`.