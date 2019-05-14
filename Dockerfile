FROM openjdk:8-jre-alpine

WORKDIR /usr/src/ldd-tool-webify

# Install Node.js, npm and wget
RUN apk update && \
    apk add --update nodejs nodejs-npm && \
    apk add wget;

# Download and install LDD Tool from PDS site
RUN wget -O ./lddtool-9.0.0-bin.tar.gz ftp://pds.nasa.gov/pub/toplevel/2010/model/lddtool-9.0.0-bin.tar.gz && \
    tar -xzf /usr/src/ldd-tool-webify/lddtool-9.0.0-bin.tar.gz;

ENV PATH="/usr/src/ldd-tool-webify/lddtool-9.0.0/bin:${PATH}"

# Copy project to docker container
COPY . .

# Install dependencies
RUN npm install --only=production

EXPOSE 3002

# Start container process that will keep container up and running
CMD [ "npm", "start" ]