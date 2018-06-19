const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");

const qwacker = require("./routes/qwacker.js");

const app = express();
app.use(morgan("short"))
app.enable('trust proxy');

// Serve the angular files
app.use(express.static(path.join(__dirname, "../dist")));

app.use(bodyParser.json());
app.use("/qwacker", qwacker);

// Any other routes go to the index.html
app.get("*", function(req, res) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
});

module.exports = app
