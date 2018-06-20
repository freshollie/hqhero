const app = require("./app.js");
const config = require("./config.js");
const server = require('http').createServer();

const hero = require("./data/hero.js");
hero.initialiseSocket(server);

server.on("request", app);
server.listen(config.port, function() {
    console.log(`Listening on ${config.port}`)
});
