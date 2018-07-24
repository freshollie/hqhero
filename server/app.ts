/**
 * MIT License
 *
 * Copyright (c) Oliver Bell <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import path from "path";
import logging from "./logging"; 

import heroApi from "./routes/hero";

const log = logging.createLogger("app");

const app = express();

app.use(morgan('tiny', {
  stream: {
    write:function(message: string){
      log.verbose(message.trim());
    }
  }
}));

// Serve the angular files
app.use(express.static(path.join(__dirname, "../dist")));

// Parse all bodies as JSON
app.use(bodyParser.json());

// Use the hero API for /hero/*** routes
app.use("/hero", heroApi);

// Any other routes redirect to the root
app.get("*", function(req, res) {
  res.redirect("/");
});

export default app
