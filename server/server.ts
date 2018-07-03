import http from 'http';

import app from './app';
import config from "./config";
import logging from "./logging";

import hero from './data/hero';

const log = logging.createLogger("server");

const server = http.createServer();
hero.initialiseSocket(server);

server.on("request", app);
server.listen(config.port, function() {
  log.info(`Listening on ${config.port}`)
});
