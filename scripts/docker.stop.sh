#!/usr/bin/env bash

### Script for stopping ldd-tool-webify Docker container

docker kill ldd-tool-webify

docker container prune -f