import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicesUiComponent } from './devices-ui.component';

describe('DevicesUiComponent', () => {
  let component: DevicesUiComponent;
  let fixture: ComponentFixture<DevicesUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesUiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
