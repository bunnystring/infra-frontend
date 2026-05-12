import { TestBed } from '@angular/core/testing';
import { DeviceDeleteModalComponent } from './device-delete-modal.component';

describe('DeviceDeleteModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceDeleteModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DeviceDeleteModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
