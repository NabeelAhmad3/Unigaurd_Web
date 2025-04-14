import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessLogsComponent } from './access-logs.component';

describe('AccessLogsComponent', () => {
  let component: AccessLogsComponent;
  let fixture: ComponentFixture<AccessLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
