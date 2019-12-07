/**
 * MIT License
 *
 * Copyright (c) Oliver Bell  <freshollie@gmail.com> 
 *             & Eddie Reeder <edlilkid@hotmail.co.uk>
 *
 */

import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, style, transition, animate, keyframes, query } from '@angular/animations';
import * as moment from 'moment';
import * as NoSleep from 'nosleep.js';
import { webSocket } from 'rxjs/webSocket';
import { retry } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

/**
 * The connection to the hero
 */


@Component({
  selector: 'app-hero',
  providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}],
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
  private static SOCKET_PATH = "/socket/hero";

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
  public smiling = false;
  public showAuthors = false;

  // Represents the connection status to the front-end
  public connected = false;
  private wakelock;

  constructor(private location: Location) {}

  ngOnInit(): void {
    this.blinkLoop(); 
    setTimeout(() => this.smiling = true, 3000);

    this.wakelock = new NoSleep.default();
    this.wakelock.enable();
  }

  /**
   * Get the full socket path using the
   * current host and the protocol
   */
  private getSocketAddress(): string {
    let uri;
    
    // When testing the socket is reconfigured based
    // on our protocol
    if (window.location.protocol === "https:") {
        uri = "wss://";
    } else {
      uri = "ws://";
    }
    const pathItems = window.location.pathname.split("/");
    pathItems.pop();

    uri += window.location.host + this.location.prepareExternalUrl(HeroComponent.SOCKET_PATH)
    return uri;
  }

  private startSocket() {
    const onOpen = new Subject<object>();
    onOpen.asObservable().subscribe(() => {
      this.onConnected();
    });
    const onClose = new Subject<void>();
    onClose.asObservable().subscribe(() => {
      this.onConnectionLost();
    });

    webSocket({
      openObserver: onOpen,
      closingObserver: onClose,
      url: this.getSocketAddress()
    }).pipe(retry())
      .subscribe((data) => {
        this.onHeroData(data); 
      });
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
