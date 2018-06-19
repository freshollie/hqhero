import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'qwackers',
  templateUrl: './qwackers.component.html',
  styleUrls: ['./qwackers.component.css']
})
export class QwackersComponent implements OnInit {

  public status = "";
  public question = "";
  public choices: Object[] = [];

  constructor(private http: HttpClient) { }
  
  ngOnInit() {
    setInterval(() => {this.tick()}, 100);
  }

  tick() {
    this.http.get("qwacker/status").subscribe(data => {
      this.status = data["status"];
      if (data["status"] == "connecting") {
        return;
      }
      
      if (data["game"] && data["game"]["round"] && data["game"]["round"]["question"]) {
        this.question = data["game"]["round"]["question"];
        this.choices = [];

        for (let answer of data["game"]["round"]["choices"]) {
          this.choices.push({answer: answer});
        }

        if (data["game"]["round"]["prediction"] != null) {
          let prediction = data["game"]["round"]["prediction"];
          for (let answer in prediction["answers"]) {
            for (let choice of this.choices) {
              if (choice["answer"] == answer) {
                choice["prediction"] = Math.round(prediction["answers"][answer] * 100);
                choice["best"] = prediction["best"] == choice["answer"];
              }
            }
          }
        }
      }
    });
  }
}
