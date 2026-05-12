import { TestBed } from '@angular/core/testing';
import { DeviceBulkUploadModalComponent } from './device-bulk-upload-modal.component';

describe('DeviceBulkUploadModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceBulkUploadModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DeviceBulkUploadModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
