// import logging and use logging.createLogger(name) and then log.info, .debug...
import winston, { transports } from "winston";
import config from "./config";

const { combine, timestamp, label, printf, colorize } = winston.format;


const consoleTransport = new winston.transports.Console({ handleExceptions: true });

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
    level: "debug",
    transports: [consoleTransport]
  });

  return log;
}


export default {createLogger: createLogger};