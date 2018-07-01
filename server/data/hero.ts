import WebSocket from "ws";
import { Server } from "http";

import logging from "../logging";

// Connecting to game server
// Initial state while we wait
// for the reporter to update us
const STATE_INITIALISING = "initialising";

// Waiting for the next game
const STATE_WAITING = "waiting";

// Game is starting soon
const STATE_STARTING = "starting";

// Finding the answer
const STATE_THONKING = "thonking";

// We have answered the question
const STATE_ANSWERED = "answered";

// We are waiting for the next question
const STATE_IDLE = "idle"

interface QuestionInfo {
  question: string;
  choices: string[];
}

interface Dict<T1,T2> {
  [Key: string]: T2;
}

interface PredictionInfo {
  answers: Dict<string,number>;
  best: string;
  speed: number;
}

interface ConclusionInfo {
  eleminated: number;
  advancing: number;
  answer: string;
  answers: Dict<string,number>;
}

interface RoundInfo {
  numRounds: number;
  question: QuestionInfo;
  num: number;
  roundNum: number;
  prediction: PredictionInfo;
  analysis: object;
  conclusion: ConclusionInfo;
}

interface NextGameInfo {
  prize: string;
  nextGame: string;
}

class Choice {
  public value: string;
  public prediction: number;
  public best: boolean;
  public selections: number;
  public correct: boolean;
}

class Round {
  public choices: Choice[];
  public question: string;
  public num: number;
  public analysis: Object;
  public predictionSpeed: number;
  public eleminated: number;
  public advancing: number;
  public answer: string;
  public correctPrediction: boolean;
}

class Game {
  public prize: String;
  public score: number;
  public round: Round;
  public numRounds: number;
}

class Hero {
  private log = logging.createLogger("Hero");
  private socketServer: WebSocket.Server;
  private state: string;
  private game: Game;
  private nextGame: NextGameInfo;
  private lastGame: Game;
  
  constructor() {
    this.state = STATE_INITIALISING;
    this.game = new Game();
    this.game.score = 0;
  }

  public initialiseSocket(server: Server) {
    this.socketServer = new WebSocket.Server({
      path:"/socket/hero",
      server: server
    });

    this.socketServer.on('connection', (client) => {
      this.log.debug("A client has connected");
      client.send(JSON.stringify(this.getStatus()));
    });
  }

  private broadcastStatus(): void {
    if (this.socketServer == null) {
      return;
    }
    const status = JSON.stringify(this.getStatus());
    let numClients = 0;
    for (let client of this.socketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(status);
        numClients++;
      }
    }
    this.log.debug(`Broadcast status to ${numClients} client(s)`)
  }

  public getStatus(): Object {
    switch(this.state) {
      case STATE_INITIALISING:
        return {status: STATE_INITIALISING}
      
      case STATE_WAITING:
        return {
          status: STATE_WAITING,
          info: this.nextGame,
          last: this.lastGame
        }
      
      case STATE_STARTING:
        return {
          status: STATE_STARTING
        }
      
      case STATE_ANSWERED:
      case STATE_THONKING:
      case STATE_IDLE:
        return {
          status: this.state,
          game: this.game
        }
      
      default:
        return {
          state: this.state,
          error: "Unknown state"
        }
    }
  }

  public onWaiting(info: NextGameInfo): void {
    this.log.debug("Waiting status received");
    // Save the last game info, as it looks like the game is over
    if (this.game && this.game.numRounds) {
      this.lastGame = new Game();
      this.lastGame.score = this.game.score;
      this.lastGame.numRounds = this.game.numRounds;
      this.game = null;
    } 

    this.state = STATE_WAITING;
    this.nextGame = info;
    this.broadcastStatus();
  }

  public onGameStarting(): void {
    this.log.debug("Game starting status received");
    this.state = STATE_STARTING;
    // Reset the game info
    this.game = {
      prize: this.nextGame.prize,
      score: 0,
      numRounds: 0,
      round: null
    };
    this.broadcastStatus();
  }

  public onNewRound(roundInfo: RoundInfo): void {
    this.log.debug("New round received");
    this.state = STATE_THONKING;

    this.game.numRounds = roundInfo.numRounds;

    const round = new Round();
    round.question = roundInfo.question.question,
    round.choices = [];
    round.num = roundInfo.num;

    for (let choiceValue of roundInfo.question.choices) {
      const choice = new Choice();
      choice.value = choiceValue;
      round.choices.push(choice);
    };

    this.game.round = round;
    this.broadcastStatus();
  }

  public onAnalysis(analysisInfo: RoundInfo): void {
    this.log.debug("Analysis received");
    const roundNum = analysisInfo.roundNum;

    if (this.game.round) {
      // Analysis for a previous question.
      // Ignore
      if (this.game.round.num != roundNum) {
        return;
      }
    } else {
      // For some reason we have no info, server restart?
      this.game.round = null;
    }

    this.state = STATE_THONKING;
    this.game.round.analysis = analysisInfo.analysis;
    this.broadcastStatus();
  }

  public onPrediction(predictionInfo: RoundInfo): void {
    this.log.debug("Prediction received");
    const roundNum = predictionInfo.roundNum;

    if (this.game.round) {
      // Analysis for a previous question.
      // Ignore
      if (this.game.round.num != roundNum) {
        return;
      }
    } else {
      // For some reason we have no info, server restart?
      this.game.round = null;
    }
    this.state = STATE_ANSWERED;
    
    // Add the prediction to the choices
    for (let answer in predictionInfo.prediction.answers) {
      for (let choice of this.game.round.choices) {
        if (choice.value == answer) {
          choice.prediction = Math.round(predictionInfo.prediction.answers[answer] * 100);
          choice.best = (predictionInfo.prediction.best == answer);
        }
      }
    }

    this.game.round.predictionSpeed = predictionInfo.prediction.speed;
    this.broadcastStatus();
  }

  public onRoundOver(roundInfo: RoundInfo): void {
    this.log.debug("Round conclusion received");
    this.state = STATE_IDLE;

    if (!this.game.numRounds) {
      return;
    }
    this.game.round.eleminated = roundInfo.conclusion.eleminated;
    this.game.round.advancing = roundInfo.conclusion.advancing;
    this.game.round.answer = roundInfo.conclusion.answer;

    for (let answer in roundInfo.conclusion.answers) {
      for (let choice of this.game.round.choices) {
        
        // For each choice, find map if the answer was correct
        // and the number of people that selected that choice
        if (choice.value == answer) {
          choice.selections = roundInfo.conclusion.answers[answer];
          choice.correct = (choice.value == roundInfo.conclusion.answer);

          // If this choice was the best predicted choice
          // find out if it was correct
          if (choice.best) {
            if (choice.value == roundInfo.conclusion.answer) {
              this.game.round.correctPrediction = true;
              if (this.game.score != null) {
                this.game.score += 1;
              }
            } else {
              this.game.round.correctPrediction = false;
            }
          }
        }
      }
    }
    this.broadcastStatus();
  }

  public onGameFinished() {
    this.log.debug("Game finished status received");
    // Save the last game info, as this is the end of the game
    if (this.game && this.game.numRounds) {
      this.lastGame = new Game();
      this.lastGame.score = this.game.score;
      this.lastGame.numRounds = this.game.numRounds;
      this.game = null;
    } 
    this.broadcastStatus();
  }
}

export default new Hero();
