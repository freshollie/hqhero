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

app.enable('trust proxy');

// Serve the angular files
app.use(express.static(path.join(__dirname, "../dist")));

app.use(bodyParser.json());
app.use("/hero", heroApi);

app.get("/", function(req, res) {
  res.sendStatus(404);
});

// Any other routes go to the index.html
app.get("*", function(req, res) {
  res.redirect("/");
});

export default app
