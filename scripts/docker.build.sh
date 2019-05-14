#!/usr/bin/env bash

### Script for building a new Docker image

./scripts/docker.clean.sh

docker build -f Dockerfile -t ldd-tool-webify .

./scripts/docker.start.sh