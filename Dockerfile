FROM node:8 as buildenv
WORKDIR /build

# Install the required node modules
COPY package.json package-lock.json ./
RUN npm install

### Build the ng app ###
FROM buildenv as ng-build

# Copy in the clientside angular sourcecode and build the angular app
COPY angular.json tsconfig.json tslint.json ./
COPY client/ client/
RUN npm run build-client

### Build the server ###
FROM buildenv  as server-build

# Copy in the server-side sourcecode
COPY server/ server/
RUN npm run build-server

### Combine the builds ###
FROM node:8
WORKDIR /hqhero

COPY package.json package-lock.json ./
RUN npm install --production

COPY --from=ng-build /build/dist/ dist/
COPY --from=server-build /build/server-build/ server/

ENV NODE_ENV=production
ENTRYPOINT node /hqhero/server/server.js
