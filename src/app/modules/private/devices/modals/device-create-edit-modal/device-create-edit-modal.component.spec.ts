import { TestBed } from '@angular/core/testing';
import { DeviceCreateEditModalComponent } from './device-create-edit-modal.component';

describe('DeviceCreateEditModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceCreateEditModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DeviceCreateEditModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
