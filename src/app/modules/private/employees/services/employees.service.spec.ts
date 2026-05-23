import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EmployeesService } from './employees.service';
import { Employee, EmployeeStatus, CreateEmployeeRq } from '../models/employee.model';
import { environment } from '../../../../../environments/environment';

const BASE = environment.apiUrl;

const mockEmployee: Employee = {
  id: 'e1',
  fullName: 'Ana García',
  email: 'ana@mail.com',
  documentType: 'CC',
  documentNumber: '111222333',
  status: EmployeeStatus.ACTIVE,
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmployeesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EmployeesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllEmployees()', () => {
    it('debe hacer GET /employees y devolver lista', () => {
      service.getAllEmployees().subscribe((employees) => {
        expect(employees.length).toBe(1);
        expect(employees[0].id).toBe('e1');
      });

      const req = httpMock.expectOne(`${BASE}/employees`);
      expect(req.request.method).toBe('GET');
      req.flush([mockEmployee]);
    });
  });

  describe('getEmployeeById()', () => {
    it('debe hacer GET /employees/:id y devolver el empleado', () => {
      service.getEmployeeById('e1').subscribe((employee) => {
        expect(employee.id).toBe('e1');
        expect(employee.fullName).toBe('Ana García');
      });

      const req = httpMock.expectOne(`${BASE}/employees/e1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployee);
    });
  });

  describe('createEmployee()', () => {
    it('debe hacer POST /employees con los datos correctos', () => {
      const payload: CreateEmployeeRq = {
        fullName: 'Nuevo Empleado',
        email: 'nuevo@mail.com',
        documentType: 'CC',
        documentNumber: '999888777',
        status: EmployeeStatus.ACTIVE,
      };

      service.createEmployee(payload).subscribe((employee) => {
        expect(employee.fullName).toBe('Nuevo Empleado');
      });

      const req = httpMock.expectOne(`${BASE}/employees`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockEmployee, ...payload, id: 'e2' });
    });
  });

  describe('updateEmployee()', () => {
    it('debe hacer PUT /employees/:id con los datos correctos', () => {
      const payload: Partial<CreateEmployeeRq> = { fullName: 'Ana Modificada' };

      service.updateEmployee('e1', payload).subscribe((employee) => {
        expect(employee.fullName).toBe('Ana Modificada');
      });

      const req = httpMock.expectOne(`${BASE}/employees/e1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockEmployee, fullName: 'Ana Modificada' });
    });
  });

  describe('deleteEmployee()', () => {
    it('debe hacer DELETE /employees/:id', () => {
      service.deleteEmployee('e1').subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${BASE}/employees/e1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
