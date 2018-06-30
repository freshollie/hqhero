
const dns = require("dns");
const allowedIps = new Set();

module.exports = function(req, res, next) {
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

    if (remote.split(".") < 3) {
        console.log(`${remote} blocked from setting data. Not a local connection`);
        return res.status(403).send({"error": "Bad request"});
    }

    dns.reverse(remote, function(err, domains) {
        if (!err && domains.length == 1) {
            // Is inside our docker network, as it has an address
            allowedIps.add(remote);
            return next();
        }
        console.log(`${remote} blocked from setting data. Not a local connection`);
        return res.status(403).send({"error": "Bad request"});
    });
}
