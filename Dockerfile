FROM node:8-alpine as node

FROM node as buildenv
WORKDIR /build/

COPY package.json lerna.json yarn.lock ./
COPY packages/hqhero-server/package.json ./packages/hqhero-server/
COPY packages/hqhero-client/package.json ./packages/hqhero-client/

RUN yarn install --frozen-lockfile

### Build the client ###
FROM buildenv as client-build

COPY packages/hqhero-client/ ./packages/hqhero-client/
RUN yarn lerna exec "yarn build" --scope=hqhero-client

### Build the server ###
FROM buildenv as server-build

COPY packages/hqhero-server/ ./packages/hqhero-server/
# Copy in the server-side sourcecode
RUN yarn lerna exec "yarn build" --scope=hqhero-server

### Combine the builds ###
FROM node:8-alpine
WORKDIR /hqhero

COPY --from=server-build /build/packages/hqhero-server/node_modules server/node_modules

COPY --from=client-build /build/packages/hqhero-client/dist public/
COPY --from=server-build /build/packages/hqhero-server/dist server/

ENV NODE_ENV=production
ENTRYPOINT node /hqhero/server/server.js
