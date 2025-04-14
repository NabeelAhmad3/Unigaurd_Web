import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GateVideoComponent } from './gate-video.component';

describe('GateVideoComponent', () => {
  let component: GateVideoComponent;
  let fixture: ComponentFixture<GateVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateVideoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GateVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
