// Connecting to game server
// Initial state while we wait
// for the reporter to update us
STATE_CONNECTING = "connecting";

// Waiting for the next game
STATE_WAITING = "waiting";

// Finding the answer
STATE_THINKING = "thonking";

// We have answered the question
STATE_ANSWERED = "answered";

// We are waiting for the next question
STATE_IDLE = "idle"

class Qwacker {
    constructor() {
        this._state = STATE_CONNECTING;

        this._game_info = {
            score: 0,
            round: {}
        };
        this._current_round = {};
        this._next_game = {};
        this._last_game = {};
    }

    getStatus() {
        switch(this._state) {
            case STATE_CONNECTING:
                return {status: STATE_CONNECTING}
            
            case STATE_WAITING:
                return {
                    status: STATE_WAITING,
                    info: this._next_game,
                    last: this._last_game
                }
            
            case STATE_ANSWERED:
            case STATE_THINKING:
            case STATE_IDLE:
                return {
                    status: this._state,
                    game: this._game_info
                }
            
            default:
                return {
                    state: this._state,
                    error: "Unknown state"
                }
        }
    }

    onWaiting(info) {
        this._state = STATE_WAITING;
        this._next_game = info;
    }

    onGameStarting() {
        this._state = STATE_WAITING;
        this._game_info = {
            prize: this._next_game.prize,
            score: 0,
            numRounds: 0,
            round: {}
        }
    }

    onNewRound(roundInfo) {
        this._state = STATE_THINKING;

        this._game_info.numRounds = roundInfo.numRounds;
        this._game_info.round = roundInfo.question
        this._game_info.round.num = roundInfo.num    
    }

    onAnalysis(analysisInfo) {
        const roundNum = analysisInfo.roundNum;

        if (this._game_info.round) {
            // Analysis for a previous question.
            // Ignore
            if (this._game_info.round.num != roundNum) {
                return;
            }
        } else {
            // For some reason we have no info, server restart?
            this._game_info.round = {};
        }

        this._state = STATE_THINKING;
        this._game_info.round.analysis = analysisInfo.analysis;
    }

    onPrediction(predictionInfo) {
        const roundNum = predictionInfo.roundNum;

        if (this._game_info.round) {
            // Analysis for a previous question.
            // Ignore
            if (this._game_info.round.num != roundNum) {
                return;
            }
        } else {
            // For some reason we have no info, server restart?
            this._game_info.round = {};
        }

        this._state = STATE_ANSWERED;
        this._game_info.round.prediction = predictionInfo.prediction;
    }

    onRoundOver(roundInfo) {
        this._state = STATE_IDLE;
        this._game_info.round.conclusion = roundInfo.conclusion;

        if (this._game_info.round.prediction) {
            
            // Did we answer correctly :D
            if (this._game_info.round.prediction.best == roundInfo.conclusion.answer) {
                this._game_info.round.conclusion.correct = true;
                if (this._game_info.score != null) {
                    this._game_info.score += 1;
                }
            } else {
                this._game_info.round.conclusion.correct = false;
            }
        }
    }

    onGameFinished() {
        // Save the last game info, as this is the end of the game
        if (this._game_info.numRounds) {
            this._last_game = {score: this._game_info.score, rounds: this._game_info.numRounds}
        } 
    }
}

module.exports = new Qwacker();
