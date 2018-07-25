/**
 * MIT License
 *
 * Copyright (c) Oliver Bell <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */
import { Router } from "express";

import hero from "../data/hero";
import guard from "../authentication/guard";

// The hero route is very simple, providing
// a status as a get request, and allowing
// guarded methods for the processor to
// let the hero know of the latest events
const router = Router();

router.get("/status", function(req, res) {
  res.send(hero.getStatus());
});

// All posts past this point
// as required to contain an info object
router.post("*", function(req, res, next) {
  const info = req.body.info;
  if (!info) {
    return res.status(422).send({ error: "Bad request" });
  }
  next();
})

// Any method which impliments the guard must be the
// same remote ip as the host hqhero is running on
// or must dns reverse to a name.
//
// The design is that the hqhero processor and website
// are within a docker network and behind a proxy
router.post("/waiting", guard, function(req, res) {
  hero.onWaiting(req.body.info);
  res.send({ success: true });
});

router.post("/starting", guard, function(req, res) {
  hero.onGameStarting();
  res.send({ success: true });
});

router.post("/round", guard, function(req, res) {
  hero.onNewRound(req.body.info);
  res.send({ success: true });
});

router.post("/analysis", guard, function(req, res) {
  hero.onAnalysis(req.body.info);
  res.send({ success: true });
});

router.post("/prediction", guard, function(req, res) {
  hero.onPrediction(req.body.info);
  res.send({ success: true });
});

router.post("/answers", guard, function(req, res) {
  hero.onRoundOver(req.body.info);
  res.send({ success: true });
});

router.post("/ended", guard, function(req, res) {
  hero.onGameFinished();
  res.send({ success: true });
});

router.use("*", function(req, res) {
  res.status(404).send()
});

export default router;
