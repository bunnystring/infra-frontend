import { TestBed } from '@angular/core/testing';
import { EmployeesComponent } from './employees.component';

describe('EmployeesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EmployeesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
