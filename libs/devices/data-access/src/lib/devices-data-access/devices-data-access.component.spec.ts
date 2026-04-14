import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicesDataAccessComponent } from './devices-data-access.component';

describe('DevicesDataAccessComponent', () => {
  let component: DevicesDataAccessComponent;
  let fixture: ComponentFixture<DevicesDataAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesDataAccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesDataAccessComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
