// import logging and use logging.createLogger(name) and then log.info, .debug...
import winston from "winston";
import config from "./config";

// Only 
let unhandledExceptions = true;

function createLogger (label: string) {
  const log = new (winston.Logger)({
    transports: [
      new (winston.transports.Console) ({
        humanReadableUnhandledException: unhandledExceptions,
        timestamp: true,
        handleExceptions: unhandledExceptions,
        colorize: true,
        level: config.logLevel,
        label: label,
        prettyPrint: true
      })
    ]
  });

  // Only the first logger needs to catch unhandled exceptions
  unhandledExceptions = false;

  return log;
}


export default {createLogger: createLogger};