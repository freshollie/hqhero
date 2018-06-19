const { Router } = require("express");
const router = Router();
const basicAuth = require("express-basic-auth");
const qwacker = require("../data/qwacker.js");
const ip = require("ip");


router.get("/status", function(req, res) {
    res.send(qwacker.getStatus());
});


const SUBNET_MASK = "255.255.0.0"
const MY_SUBNET = ip.mask(ip.address(), SUBNET_MASK);
const protected = function(req, res, next) {
    /**
     * Only allow local ip addresses through
     */
    const remote = req.ip.split(":").pop()
    if (remote == "1" || 
            remote == "127.0.0.1" || 
            ip.mask(remote, SUBNET_MASK) == MY_SUBNET) {
        return next();
    } else {
        res.status(403).send();
    }
}

router.post("*", function(req, res, next) {
    const info = req.body.info;
    if (!info) {
        return res.status(422).send({ error: "Bad request" });
    }
    next();
})

router.post("/waiting", protected, function(req, res) {
    qwacker.onWaiting(req.body.info);
    res.send({ success: true });
});

router.post("/starting", protected, function(req, res) {
    qwacker.onGameStarting(req.body.info);
    res.send({ success: true });
});

router.post("/round", protected, function(req, res) {
    qwacker.onNewRound(req.body.info);
    res.send({ success: true });
});

router.post("/analysis", protected, function(req, res) {
    qwacker.onAnalysis(req.body.info);
    res.send({ success: true });
});

router.post("/prediction", protected, function(req, res) {
    qwacker.onPrediction(req.body.info);
    res.send({ success: true });
});

router.post("/answers", protected, function(req, res) {
    qwacker.onRoundOver(req.body.info);
    res.send({ success: true });
});

router.post("/ended", protected, function(req, res) {
    qwacker.onGameFinished(req.body.info);
    res.send({ success: true });
});

router.use("*", function(req, res) {
    res.status(404).send()
});

module.exports = router;
