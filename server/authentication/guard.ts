import dns from 'dns';
import {Request, Response, NextFunction} from 'express';
import logging from "../logging";

const log = logging.createLogger("guard");

const allowedIps: Set<string> = new Set();

function block(remote: string, res: Response) {
  log.warn(`${remote} blocked from setting data. Not a local connection`);
  return res.status(403).send({"error": "Bad request"});
}

export default function guard(req: Request, res: Response, next: NextFunction) {
  /**
   * Only allow ips which resolve to a domain name.
   * 
   * As this service is behind a docker ingress network and proxy,
   * the ips seen from the server will never be local if the ip 
   * is remote.
   * 
   * This is a kinda hack. Future will move this service inwards
   */
  const remote = req.ip.split(":").pop();

  if (remote == "1" || remote == "127.0.0.1") {
    return next();
  }

  if (allowedIps.has(remote)) {
    return next();
  }

  if (remote.split(".").length < 3) {
    return block(remote, res);
  }
  log.debug(`Received data from new ip, ${remote}. Checking authenticity`)
  dns.reverse(remote, function(err, domains) {
    if (!err && domains.length == 1) {
      // Is inside our docker network, as it has an address
      allowedIps.add(remote);
      log.debug(`Authenticity granted for ${remote}`);
      return next();
    }
    return block(remote, res);
  });
}
