import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { EmployeesStore } from './employees.store';
import { EmployeesService } from '../services/employees.service';
import { Employee, EmployeeStatus } from '../models/employee.model';

const mockEmployees: Employee[] = [
  { id: 'e1', fullName: 'Ana García', email: 'ana@mail.com', documentType: 'CC', documentNumber: '111', status: EmployeeStatus.ACTIVE },
  { id: 'e2', fullName: 'Luis Pérez', email: 'luis@mail.com', documentType: 'CC', documentNumber: '222', status: EmployeeStatus.INACTIVE },
  { id: 'e3', fullName: 'Marta López', email: 'marta@mail.com', documentType: 'CE', documentNumber: '333', status: EmployeeStatus.ACTIVE },
];

describe('EmployeesStore', () => {
  let store: InstanceType<typeof EmployeesStore>;
  let employeesServiceSpy: { getAllEmployees: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    employeesServiceSpy = { getAllEmployees: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        EmployeesStore,
        { provide: EmployeesService, useValue: employeesServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(EmployeesStore);
  });

  describe('Estado inicial', () => {
    it('debe inicializar con lista vacía', () => {
      expect(store.employees()).toEqual([]);
    });

    it('debe inicializar sin carga activa', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('debe inicializar sin error', () => {
      expect(store.error()).toBeNull();
    });

    it('stats inicial debe tener todos los valores en 0', () => {
      const stats = store.stats();
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.inactive).toBe(0);
    });
  });

  describe('loadEmployees()', () => {
    it('debe cargar empleados y actualizar el estado', async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(of(mockEmployees));

      await firstValueFrom(store.loadEmployees());

      expect(store.employees()).toEqual(mockEmployees);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('debe manejar error del servicio y actualizar store.error()', async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(throwError(() => new Error('Network error')));

      await firstValueFrom(store.loadEmployees());

      expect(store.error()).toBe('Error al cargar empleados');
      expect(store.isLoading()).toBe(false);
      expect(store.employees()).toEqual([]);
    });
  });

  describe('stats computed', () => {
    it('debe calcular estadísticas correctamente', async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(of(mockEmployees));
      await firstValueFrom(store.loadEmployees());

      const stats = store.stats();
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
    });
  });

  describe('upsertEmployee()', () => {
    beforeEach(async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(of(mockEmployees));
      await firstValueFrom(store.loadEmployees());
    });

    it('debe actualizar un empleado existente por ID', () => {
      const updated: Employee = { ...mockEmployees[0], fullName: 'Ana García Modificada' };
      store.upsertEmployee(updated);

      const found = store.employees().find((e) => e.id === 'e1');
      expect(found?.fullName).toBe('Ana García Modificada');
      expect(store.employees().length).toBe(3);
    });

    it('debe agregar un empleado nuevo si el ID no existe', () => {
      const newEmployee: Employee = { id: 'e4', fullName: 'Carlos Díaz', email: 'carlos@mail.com', documentType: 'CC', documentNumber: '444', status: EmployeeStatus.ACTIVE };
      store.upsertEmployee(newEmployee);

      expect(store.employees().length).toBe(4);
      expect(store.employees().find((e) => e.id === 'e4')).toBeTruthy();
    });
  });

  describe('removeEmployee()', () => {
    beforeEach(async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(of(mockEmployees));
      await firstValueFrom(store.loadEmployees());
    });

    it('debe eliminar el empleado con el ID indicado', () => {
      store.removeEmployee('e1');

      expect(store.employees().length).toBe(2);
      expect(store.employees().find((e) => e.id === 'e1')).toBeUndefined();
    });

    it('no debe modificar la lista si el ID no existe', () => {
      store.removeEmployee('inexistente');
      expect(store.employees().length).toBe(3);
    });
  });

  describe('clearError()', () => {
    it('debe limpiar el error del estado', async () => {
      employeesServiceSpy.getAllEmployees.mockReturnValue(throwError(() => new Error('fail')));
      await firstValueFrom(store.loadEmployees());
      expect(store.error()).not.toBeNull();

      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});
