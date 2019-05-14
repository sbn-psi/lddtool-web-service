#!/usr/bin/env bash

### Script to stop, remove, and prune ldd-tool-webify image and all containers

DOCKER_CONTAINER_ID=$(docker ps --format "{{.ID}}" --filter "name=ldd-tool-webify")

# if a docker container already exists, stop it
if [ ${#DOCKER_CONTAINER_ID} -gt 0 ]; then
    docker kill $DOCKER_CONTAINER_ID
else
    echo "no docker container to stop. proceed."
fi

docker container prune -f

docker image rm ldd-tool-webify
docker image prune -f
