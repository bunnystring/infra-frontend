import { TestBed } from '@angular/core/testing';
import { EmployeeCreateEditModalComponent } from './employee-create-edit-modal.component';

describe('EmployeeCreateEditModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeCreateEditModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EmployeeCreateEditModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
