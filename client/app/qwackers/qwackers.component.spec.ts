import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QwackersComponent } from './qwackers.component';

describe('QwackersComponent', () => {
  let component: QwackersComponent;
  let fixture: ComponentFixture<QwackersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QwackersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QwackersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
