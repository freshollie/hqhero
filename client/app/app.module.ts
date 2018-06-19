import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { QwackersComponent } from './qwackers/qwackers.component';
import { MatCardModule } from '@angular/material/card';
import { ParticlesModule } from 'angular-particle';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    QwackersComponent
  ],
  imports: [
    BrowserModule,
    MatCardModule,
    ParticlesModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
