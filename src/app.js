const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const qwacker = require("./routes/qwacker.js");

const app = express();
app.use(morgan("short"))
app.enable('trust proxy');

app.use(bodyParser.json());

app.use("/qwacker", qwacker);

app.get("/", function(req, res) {
    res.send("Quacker is coming");
});

app.use("*", function(req, res) {
    res.redirect("http://" + req.headers.host + req.url);
})
module.exports = app
