import { TestBed } from '@angular/core/testing';
import { EmployeeDeleteModalComponent } from './employee-delete-modal.component';

describe('EmployeeDeleteModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDeleteModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EmployeeDeleteModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
