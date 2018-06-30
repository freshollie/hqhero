
const dns = require("dns");

const PROXY_DNS_NAME = "proxy";

module.exports = function(req, res, next) {
    /**
     * Only allow ips through which are not either
     * local, or not from the proxies.
     * 
     * Kinda a hack.
     */
    const remote = req.ip.split(":").pop();

    if (remote == "1" || remote == "127.0.0.1") {
        return next();
    }

    if (remote.split(".") < 3) {
        console.log(`${remote} blocked from setting data. Not a local connection`);
        return res.status(403).send({"error": "Bad request"});
    }

    dns.reverse(remote, function(err, domains) {
        if (!err && domains.length == 1) {
            // Is inside our docker network, as it has an address
            return next();
        }
        console.log(`${remote} blocked from setting data. Not a local connection`);
        return res.status(403).send({"error": "Bad request"});
    });
}
