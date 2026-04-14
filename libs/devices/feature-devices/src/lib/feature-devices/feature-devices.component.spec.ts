import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureDevicesComponent } from './feature-devices.component';

describe('FeatureDevicesComponent', () => {
  let component: FeatureDevicesComponent;
  let fixture: ComponentFixture<FeatureDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureDevicesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureDevicesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
