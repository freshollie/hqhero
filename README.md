<img align="right" alt="icon" src="client/assets/icons/android-chrome-384x384.png" height="150px">

# HQhero

Your quiz hero. A lightweight and responsive frontend 
for a quiz prediction robot.

## Running

`npm` is used to manage the dependencies of HQhero.

`npm install` will install all dependencies

### Commands

- `npm start` to build the client and start the server in development mode
- `npm run build-client` to build the client for distribution
- `npm run build-server` to build the server for distribution
- `node server-build/server.js` to run the built server and client

## Technicals

HQhero uses Websockets to transmit the information quickly, easily, and efficiently.

It requires a quiz processor to transmit answer predictions and other
information about the game to the service. The processor sends events 
to hqhero, where it will then broadcast those events to all connected users.

hqhero.com uses [herobrain](https://github.com/freshollie/herobrain) as a processor.

### Input API

Method | URI | Body | Description
--- | --- | --- | ---
POST | /hero/waiting | `{"info": {"prize"?: string, "nextGame"?: string}}` | Waiting for the next game, prize and next game are optional
POST | /hero/starting | `{"info": {}}` | The game is starting
POST | /hero/round | `{"info": {"numRounds": number, "question": {"question": string, "choices": string[]}, "num": number, roundNum: number}}` | Next round has started
POST | /hero/analysis | `{"info": AnalysisObject}` | Analysis of the round. Not used on the frontend, but broadcast.
POST | /hero/prediction | `{"info": {"answers": Dict<string,number>, "best": string, "speed": number}}` | Prediction of choices
POST | /hero/answers | `{"info": {"eleminated": number, "advancing": number, "answer": string, "answers": Dict<string,number>}}` | Conclusion of round. `answer` and `answers` are the only implimented data keys. Others are broadcast but not used on the front-end
POST | /hero/ended | `{"info": {}}` | Not implimented, game transisions using `waiting`

API response is always `{success: true}` for a successful input

## Deployment

<img align="right" alt="demo" src="demo/demo.gif" height="400px">

Deploying this webapp as a container is the recommended practice.

[herobrain](https://github.com/freshollie/herobrain) should be pointed
towards your `hqhero` service.

HQhero is designed to only have a single service running. It is
designed with a reverse proxy in mind for routing. Multiple HQhero 
services can be configured to represent different quiz regions and
then routed to via a reverse proxy.

In this example, hqhero is designed for /uk /us and /de.

## HQhero.com

hqhero.com is the current host of HQhero. We currently receive 600+ users a day, with a viewership in 80+ countries.

We opensourced HQhero in the hope that it is useful for others to read or take inspiration from

## License

HQhero is released under the MIT license. Logo is Copyright Eddie Reeder

## Credits

- Oliver Bell - Backend, Architecture, DevOps
- Eddie Reeder - Frontend, Design, Animation, Logo

