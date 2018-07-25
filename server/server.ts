/**
 * MIT License
 *
 * Copyright (c) Oliver Bell <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */

import http from 'http';

import app from './app';
import config from "./config";
import logging from "./logging";

import hero from './data/hero';

const log = logging.createLogger("server");

// Creating a using a http server for the front
// and of the express app allows our
// websocket and http methods to be on
// the same port
const server = http.createServer();
hero.initialiseSocket(server);

server.on("request", app);
server.listen(config.port, function() {
  log.info(`Listening on ${config.port}`)
});
