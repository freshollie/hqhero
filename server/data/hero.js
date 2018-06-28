const WebSocket = require("ws");

// Connecting to game server
// Initial state while we wait
// for the reporter to update us
STATE_INITIALISING = "initialising";

// Waiting for the next game
STATE_WAITING = "waiting";

// Game is starting soon
STATE_STARTING = "starting";

// Finding the answer
STATE_THONKING = "thonking";

// We have answered the question
STATE_ANSWERED = "answered";

// We are waiting for the next question
STATE_IDLE = "idle"

class Hero {
    constructor() {
        this._socketServer = null;
        this._state = STATE_INITIALISING;

        this._gameInfo = {
            score: 0,
            round: {}
        };
        this._nextGame = {};
        this._lastGame = {};
    }

    initialiseSocket(server) {
        this._socketServer = new WebSocket.Server({
            path:"/socket/hero",
            server: server
        });

        this._socketServer.on('connection', (client) => {
            console.log("Client connected");
            client.send(JSON.stringify(this.getStatus()));
        });
    }

    broadcastStatus() {
        if (this._socketServer == null) {
            return;
        }

        let numClients = 0;
        for (let client of this._socketServer.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(this.getStatus()));
                numClients++;
            }
        }
        console.log(`Broadcast status to ${numClients} client(s)`)
    }

    getStatus() {
        switch(this._state) {
            case STATE_INITIALISING:
                return {status: STATE_INITIALISING}
            
            case STATE_WAITING:
                return {
                    status: STATE_WAITING,
                    info: this._nextGame,
                    last: this._lastGame
                }
            
            case STATE_STARTING:
                return {
                    status: STATE_STARTING
                }
            
            case STATE_ANSWERED:
            case STATE_THONKING:
            case STATE_IDLE:
                return {
                    status: this._state,
                    game: this._gameInfo
                }
            
            default:
                return {
                    state: this._state,
                    error: "Unknown state"
                }
        }
    }

    onWaiting(info) {
        // Save the last game info, as it looks like the game is over
        if (this._gameInfo.numRounds) {
            this._lastGame = {score: this._gameInfo.score, rounds: this._gameInfo.numRounds}
            this._gameInfo = null;
        } 

        this._state = STATE_WAITING;
        this._nextGame = info;
        this.broadcastStatus();
    }

    onGameStarting() {
        this._state = STATE_STARTING;
        // Reset the game info
        this._gameInfo = {
            prize: this._nextGame.prize,
            score: 0,
            numRounds: 0,
            round: {}
        };
        this.broadcastStatus();
    }

    onNewRound(roundInfo) {
        this._state = STATE_THONKING;

        this._gameInfo.numRounds = roundInfo.numRounds;
        this._gameInfo.round = {
            question: roundInfo.question.question,
            choices: [],
            num: roundInfo.num,
            analysis: null
        };

        for (let choice of roundInfo.question.choices) {
            this._gameInfo.round.choices.push({
                value: choice,
                prediction: null,
                best: false,
            });
        };
        this.broadcastStatus();
    }

    onAnalysis(analysisInfo) {
        const roundNum = analysisInfo.roundNum;

        if (this._gameInfo.round) {
            // Analysis for a previous question.
            // Ignore
            if (this._gameInfo.round.num != roundNum) {
                return;
            }
        } else {
            // For some reason we have no info, server restart?
            this._gameInfo.round = {};
        }

        this._state = STATE_THONKING;
        this._gameInfo.round.analysis = analysisInfo.analysis;
        this.broadcastStatus();
    }

    onPrediction(predictionInfo) {
        const roundNum = predictionInfo.roundNum;

        if (this._gameInfo.round) {
            // Analysis for a previous question.
            // Ignore
            if (this._gameInfo.round.num != roundNum) {
                return;
            }
        } else {
            // For some reason we have no info, server restart?
            this._gameInfo.round = {};
        }
        this._state = STATE_ANSWERED;
        
        // Add the prediction to the choices
        for (let answer in predictionInfo.prediction.answers) {
            for (let choice of this._gameInfo.round.choices) {
                if (choice.value == answer) {
                    choice.prediction = Math.round(predictionInfo.prediction.answers[answer] * 100);
                    choice.best = (predictionInfo.prediction.best == answer);
                }
            }
        }

        this._gameInfo.round.predictionSpeed = predictionInfo.speed;
        this.broadcastStatus();
    }

    onRoundOver(roundInfo) {
        this._state = STATE_IDLE;
        //
        if (!this._gameInfo.numRounds) {
            return;
        }
        this._gameInfo.round.eleminated = roundInfo.conclusion.eleminated;
        this._gameInfo.round.advancing = roundInfo.conclusion.advancing;
        this._gameInfo.round.answer = roundInfo.conclusion.answer;


        for (let answer in roundInfo.conclusion.answers) {
            for (let choice of this._gameInfo.round.choices) {
                if (choice.value == answer) {
                    choice.selections = roundInfo.conclusion.answers[answer];
                    choice.correct = choice.value == roundInfo.conclusion.answer;
                    if (choice.best) {
                        if (choice.value == roundInfo.conclusion.answer) {
                            this._gameInfo.round.correctPrediction = true;
                            if (this._gameInfo.score != null) {
                                this._gameInfo.score += 1;
                            }
                        } else {
                            this._gameInfo.round.correctPrediction = false;
                        }
                    }
                }
            }
        }
        this.broadcastStatus();
    }

    onGameFinished() {
        // Save the last game info, as this is the end of the game
        if (this._gameInfo.numRounds) {
            this._lastGame = {score: this._gameInfo.score, rounds: this._gameInfo.numRounds}
        } 
        this.broadcastStatus();
    }
}

module.exports = new Hero();
