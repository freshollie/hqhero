import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { trigger,style,transition,animate,keyframes,query,group,state } from '@angular/animations';
import * as moment from 'moment';

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

  public status = "";
  public wait = "";
  public prize = "0";
  public nextGameTime = null;
  public question = "";
  public choices: Object[] = [];
  public analysis: Object = {};
  public blinkState = "inactive";

  public objectKeys = Object.keys;
  
  // Represents the connection status to the front-end
  public connected = false;

  // Represents if a connection is currently present
  private connection = false;
  private reconnectAttempts = 0;

  private socket: WebSocket;

  constructor() {}
  
  private getWebsocketUri(): string {
    let loc = window.location, uri;
    if (loc.protocol === "https:") {
        uri = "wss://";
    } else {
      uri = "ws://";
    }
    uri += loc.host + window.location.pathname + "socket/hero";
    return uri;
  }

  private connect() {
    this.socket = new WebSocket(this.getWebsocketUri());

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.connected = true;
      this.connection = true;
    }

    this.socket.onmessage = (message) => {
      if (message["data"]) {
        this.onData(JSON.parse(message["data"]));
      }
    };

    this.socket.onclose = () => {
      if (!this.connection) {
        this.reconnectAttempts += 1;
        if (this.reconnectAttempts > 5) {
          this.connected = false;
          this.status = "";
        }
        setTimeout(() => {this.connect()}, 1000);
      } else {
        this.connection = false;
        this.connect();
      }
    }
  }

  ngOnInit(): void {
    // Testing waiting status
    
    this.connected = true;
    this.status = 'waiting';
    this.wait = 'in 5 hours';
    this.prize = '$400,000';
    

    //this.connect();
    this.blinkLoop();
  }

  onData(data): void {
    this.status = data["status"];
    if (this.status == "connecting") {
      return;
    }

    if (this.status == "waiting") {
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
    
    if (data["game"] && data["game"]["round"]) {
      // this.analysis = {}
      if (data["game"]["round"]["question"]) {

        // If question is new, re-assign all. Otherwise, update choices.
        if (data["game"]["round"]["question"] != this.question) {

          this.question = data["game"]["round"]["question"];
          this.choices = data["game"]["round"]["choices"];
        } else {
          
          for (let choiceNum in this.choices) {
            for (let property in data["game"]["round"]["choices"][choiceNum]) {
              this.choices[choiceNum][property] =  data["game"]["round"]["choices"][choiceNum][property];
            }
          }
        }
      }

      if (data["game"]["round"]["analysis"]) {
        this.analysis = data["game"]["round"]["analysis"];
      }
    }
  }

  public getBackgroundPosition(choice) {
    if (choice.prediction == undefined) {
      return '100% 100%';
    }
    let value = 100 - choice.prediction;
    return value + '% 100%';
  }

  public isCorrect() {
    for (let choice of this.choices) {
      if (choice['best'] && choice['correct']) {
        return true;
      }
    }
    return false;
  }

  public isIncorrect() {
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
      if (this.status != 'waiting') {
        this.blink();
      }
      this.blinkLoop();
    }, 2000 + Math.random() * 8000);
  }

  public blink() {
    this.blinkState = 'active';
  }

  public resetBlinkState() {
    this.blinkState = 'inactive';
  }
}
