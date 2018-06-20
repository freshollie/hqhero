import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

@Component({
  selector: 'hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit {

  public status = "";
  public wait = "";
  public prize = 0;
  public nextGameTime = null;
  public question = "";
  public choices: Object[] = [];
  public analysis: Object = {};

  public objectKeys = Object.keys;
  
  // Represents the connection status to the front-end
  public connected = false;

  // Represents if a connection is currently present
  private connection = false;
  private reconnectAttempts = 0;

  private socket: WebSocket;

  constructor(private http: HttpClient) {}
  
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
    this.connect();
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
      }
    }
    
    if (data["game"] && data["game"]["round"]) {
      //this.analysis = {}
      if (data["game"]["round"]["question"]) {
        this.question = data["game"]["round"]["question"];
        this.choices = data["game"]["round"]["choices"];
      }

      if (data["game"]["round"]["analysis"]) {
        this.analysis = data["game"]["round"]["analysis"];
      }
    }
  }
}
