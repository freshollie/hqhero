/**
 * MIT License
 *
 * Copyright (c) Oliver Bell <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */

import dns from 'dns';
import {Request, Response, NextFunction} from 'express';
import logging from "../logging";

const log = logging.createLogger("guard");

const allowedIps: Set<string> = new Set();

// Inform the requester that this is not legal
function block(remote: string, res: Response) {
  log.warn(`${remote} blocked from setting data. Not a local connection`);
  return res.status(403).send({"error": "Bad request"});
}

/**
 * Only allow ips which resolve to a domain name, or are our
 * ip shall be allowed to pass.
 * 
 * This isn't perfect for those that don't want to use
 * a docker network to host hero.
 **/
export default function guard(req: Request, res: Response, next: NextFunction) {
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
