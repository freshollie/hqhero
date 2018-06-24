
const ip = require("ip");
const basicAuth = require("express-basic-auth");

const SUBNET_MASK = "255.0.0.0"

module.exports = function(req, res, next) {
    /**
     * Only allow local ip addresses through
     */
    const remote = req.ip.split(":").pop();
    const serverSubnet = ip.mask(ip.address(), mySubnet);

    if (remote == "1" || 
            remote == "127.0.0.1" || 
            ip.mask(remote, SUBNET_MASK) == serverSubnet) {
        return next();
    } else {
        console.log(`${remote} blocked. Not in ${serverSubnet}`);
        res.status(403).send({"error": "Bad request"});
    }
}
