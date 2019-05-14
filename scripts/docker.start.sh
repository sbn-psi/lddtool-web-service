#!/usr/bin/env bash

### Script for starting a new Docker ldd-tool-webify container

docker run --name ldd-tool-webify -d -p 3002:3002 ldd-tool-webify:latest