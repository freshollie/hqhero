/**
 * MIT License
 *
 * Copyright (c) Oliver Bell  <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */

// import logging and use logging.createLogger(name) and then log.info, .debug...
import winston, { transports } from "winston";
import config from "./config";

const { combine, timestamp, label, printf, colorize } = winston.format;


let handleExceptions = true;

const myFormat = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

function createLogger (logLabel: string) {
  const log = winston.createLogger({
    format: combine(
      colorize(),
      label({ label: logLabel}),
      timestamp(),
      myFormat
    ),
    level: config.logLevel,
    transports: [new winston.transports.Console({ handleExceptions: handleExceptions })]
  });

  handleExceptions = false;

  return log;
}


export default {createLogger: createLogger};