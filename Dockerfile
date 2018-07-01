# Build the ng app
FROM node:8 as ng-build

WORKDIR /build

# Install the required node modules
COPY package.json package-lock.json ./
RUN npm install

# Copy in the clientside angular sourcecode and build the angular app
COPY angular.json tsconfig.json tslint.json ./
COPY client/ client/
RUN npm run build-client

# Build the server
FROM node:8 as server-build

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm install

# Copy in the server-side sourcecode
COPY server/ server/
RUN npm run build-server

# Make the image
FROM node:8
WORKDIR /hqhero

RUN npm install --production

COPY --from=ng-build /build/dist/ dist/
COPY --from=server-build /build/server-build/ server/

ENV NODE_ENV=production
CMD node /hqhero/server/server.js
