/**
 * MIT License
 *
 * Copyright (c) Oliver Bell  <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */

import { Component, OnInit, ApplicationRef, HostListener } from '@angular/core';
import { trigger, style, transition, animate, keyframes, query } from '@angular/animations';
import * as moment from 'moment';
import * as NoSleep from 'nosleep.js';

/**
 * The connection to the hero
 */
class HeroSocket {
  private static path = "/socket/hero";

  /**
   * Get the full socket path using the
   * current host and the protocol
   */
  private static getSocketURI(): string {
    const loc = window.location; 
    let uri;
    
    // When testing the socket is reconfigured based
    // on our protocol
    if (loc.protocol === "https:") {
        uri = "wss://";
    } else {
      uri = "ws://";
    }
    const pathItems = window.location.pathname.split("/");
    pathItems.pop();

    uri += loc.host + pathItems.join("/") + HeroSocket.path;
    return uri;
  }

  // Represents if a connection is currently present
  private connection = false;
  private reconnectAttempts = 0;

  private onStateCallback;
  private onConnectionLostCallback;
  private onConnectedCallback;

  constructor(
      onStateCallback: Function, 
      connectedCallback: Function, 
      connectionLostCallback: Function
    ) {
    this.onStateCallback = onStateCallback;
    this.onConnectedCallback = connectedCallback;
    this.onConnectionLostCallback = connectionLostCallback;
  }

  /**
   * Initialise the connection, reconnecting
   * after connection failures
   */
  public initialise(): void {
    this.connect();
  }

  /**
   * Connect to the socket, reconnecting
   * on failure
   */
  private connect() {
    const socket = new WebSocket(HeroSocket.getSocketURI());

    socket.onopen = () => {
      this.onOpen();
    }

    socket.onmessage = (message) => {
      this.onMessage(message);
    };

    socket.onclose = () => {
      this.onClose();
    }
  }

  private onOpen() {
    this.reconnectAttempts = 0;
    this.connection = true;
    this.onConnectedCallback();
  }

  private onMessage(message: Object) {
    if (message["data"]) {
      this.onStateCallback(JSON.parse(message["data"]));
    }
  }

  /**
   * When the connection closes, try
   * to re-initialise 5 times, before
   * emmiting a connection lost event
   */
  private onClose() {
    if (!this.connection) {
      this.reconnectAttempts += 1;
      if (this.reconnectAttempts > 5) {
        this.onConnectionLostCallback();
      }
      setTimeout(() => {this.connect()}, 1000);
    } else {
      this.connection = false;
      this.initialise();
    }
  }
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  animations: [
    trigger('blinkAnimation', [
      transition('* => active', query('.eyes', [
        animate(200, keyframes([
          style({height: '2rem', offset: 0}),
          style({height: '0rem', offset: 0.5}),
          style({height: '2rem', offset: 1}),
        ]))
      ]))
    ]),
  ]
})
export class HeroComponent implements OnInit {

  public STATE_NONE = "";
  public STATE_INITIALISING = "initialising";
  public STATE_WAITING = "waiting";
  public STATE_STARTING = "starting";
  public STATE_THONKING = "thonking";
  public STATE_ANSWERED = "answered";

  public state = this.STATE_NONE;
  public gameActive = false;

  // How long (In english) until the next game
  public wait = "";

  // The prize for the next game (Comes with the currency)
  public prize = "0";

  // The time of the next game
  public nextGameTime = null;
  public question = "";

  // The question number for this game
  public questionNum = null;

  public choices: Object[] = [];
  public analysis: Object = {};

  public blinkState = "inactive";

  private heroSocket = new HeroSocket(
    (state: Object) => {this.onHeroData(state)}, 
    () => {this.onConnected()},
    () => {this.onConnectionLost()}
  );

  // Represents the connection status to the front-end
  public connected = false;
  private wakelock;

  constructor(private applicationRef: ApplicationRef) {}

  ngOnInit(): void {
    this.heroSocket.initialise();
    this.blinkLoop(); 

    this.wakelock = new NoSleep.default();
  }

  @HostListener('click')
  @HostListener('touchstart') 
  onEvent() {
    if (this.wakelock.noSleepVideo.paused) {
      // Don't let the phone sleep
      this.wakelock.enable();
    }
  }

  private resetGame(): void {
    this.questionNum = null;
    this.question = "";
    this.choices = [];
  }

  private onConnected(): void {
    this.connected = true;
  }

  private onConnectionLost(): void {
    this.state = this.STATE_NONE;
    
    this.connected = false;
  }

  private onHeroData(data: object): void {
    this.state = data["status"];

    if (this.state == this.STATE_INITIALISING) {
      // Waiting for the backend to connect to HQ
      this.resetGame();
      this.gameActive = false;
    } else if (this.state == this.STATE_WAITING) {
      // Waiting for the next game
      this.resetGame();
      this.onWaiting(data);
    } else if (data["game"] && data["game"]["round"]) {
      // Round information has game through
      this.onRoundData(data["game"]["round"]);
    }
  }

  private onWaiting(data: object): void {
    this.gameActive = false;

    if (data["info"]["nextGame"]) {
      this.wait = moment(data["info"]["nextGame"]).fromNow();
      this.nextGameTime = data["info"]["nextGame"];
      this.prize = data["info"]["prize"];
    } else {
      this.wait = null;
      this.nextGameTime = null;
      this.prize = null;
    }
  }

  private onRoundData(round: object): void {
    this.gameActive = true;
      // this.analysis = {}
    if (round["question"]) {
      // If question is new, re-assign all. Otherwise, update choices.
      // The choices include the predictions for each choice
      // When the prediction comes through
      if (round["question"] != this.question) {
        this.questionNum = round["num"];
        this.question = round["question"];
        this.choices = round["choices"];
      } else {
        for (let choiceNum in this.choices) {
          for (let property in round["choices"][choiceNum]) {
            this.choices[choiceNum][property] =  round["choices"][choiceNum][property];
          }
        }
      }
    }

    // Analysis of the current question
    if (round["analysis"]) {
      this.analysis = round["analysis"];
    }
  }

  public calculateChoiceBackgroundPosition(choice) {
    if (choice.prediction == undefined) {
      return '100% 100%';
    }
    let value = 100 - choice.prediction;
    return value + '% 100%';
  }

  public wasCorrect() {
    for (let choice of this.choices) {
      if (choice['best'] && choice['correct']) {
        return true;
      }
    }
    return false;
  }

  public wasIncorrect() {
    for (let choice of this.choices) {
      if (choice['correct']) {
        if (!choice['best']) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  private blinkLoop() {
    setTimeout(() => {
      if (this.state != 'waiting') {
        this.blink();
      }
      this.blinkLoop();
    }, 2000 + Math.random() * 8000);
  }

  private blink() {
    this.blinkState = 'active';
  }

  public resetBlinkState() {
    this.blinkState = 'inactive';
  }
}
