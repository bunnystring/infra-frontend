import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EmployeesComponent } from './employees.component';
import { EmployeesStore } from '../../store/employees.store';
import { EmployeesService } from '../../services/employees.service';
import { Employee, EmployeeStatus } from '../../models/employee.model';

const mockEmployees: Employee[] = [
  { id: 'e1', fullName: 'Ana García', email: 'ana@empresa.com', documentType: 'CC', documentNumber: '111', status: EmployeeStatus.ACTIVE },
  { id: 'e2', fullName: 'Luis Pérez', email: 'luis@empresa.com', documentType: 'CC', documentNumber: '222', status: EmployeeStatus.INACTIVE },
  { id: 'e3', fullName: 'Marta López', email: 'marta@empresa.com', documentType: 'CE', documentNumber: '333', status: EmployeeStatus.ACTIVE },
];

describe('EmployeesComponent', () => {
  let component: EmployeesComponent;
  let fixture: ComponentFixture<EmployeesComponent>;
  let employeesServiceSpy: { getAllEmployees: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    employeesServiceSpy = { getAllEmployees: vi.fn() };
    employeesServiceSpy.getAllEmployees.mockReturnValue(of(mockEmployees));

    await TestBed.configureTestingModule({
      imports: [EmployeesComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        EmployeesStore,
        { provide: EmployeesService, useValue: employeesServiceSpy },
      ],
    }).compileComponents();

    const store = TestBed.inject(EmployeesStore);
    await store.loadEmployees().toPromise();

    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('filteredEmployees()', () => {
    it('debe devolver todos los empleados sin búsqueda activa', () => {
      expect(component.filteredEmployees().length).toBe(3);
    });

    it('debe filtrar por nombre completo', () => {
      component.search.set('ana');
      expect(component.filteredEmployees().length).toBe(1);
      expect(component.filteredEmployees()[0].fullName).toBe('Ana García');
    });

    it('debe filtrar por email', () => {
      component.search.set('luis@empresa');
      expect(component.filteredEmployees().length).toBe(1);
      expect(component.filteredEmployees()[0].id).toBe('e2');
    });

    it('debe ser insensible a mayúsculas', () => {
      component.search.set('MARTA');
      expect(component.filteredEmployees().length).toBe(1);
    });

    it('debe devolver lista vacía sin coincidencias', () => {
      component.search.set('zzznomatch');
      expect(component.filteredEmployees().length).toBe(0);
    });
  });

  describe('filteredStats()', () => {
    it('debe calcular el total, activos e inactivos', () => {
      const stats = component.filteredStats();
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
    });

    it('debe recalcular al filtrar', () => {
      component.search.set('ana');
      const stats = component.filteredStats();
      expect(stats.total).toBe(1);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(0);
    });
  });

  describe('paginación', () => {
    it('totalItems debe reflejar los empleados filtrados', () => {
      expect(component.totalItems()).toBe(3);
    });

    it('pagedEmployees debe respetar el tamaño de página', () => {
      component.pageSize.set(2);
      expect(component.pagedEmployees().length).toBe(2);
    });

    it('goToPage debe actualizar la página actual', () => {
      component.pageSize.set(2);
      component.goToPage(2);
      expect(component.page()).toBe(2);
    });

    it('nextPage no debe superar el total de páginas', () => {
      component.pageSize.set(2);
      component.goToPage(2);
      component.nextPage();
      expect(component.page()).toBe(2);
    });

    it('previousPage no debe bajar de página 1', () => {
      component.previousPage();
      expect(component.page()).toBe(1);
    });

    it('setPageSize debe resetear la página a 1', () => {
      component.page.set(3);
      component.setPageSize('20');
      expect(component.pageSize()).toBe(20);
      expect(component.page()).toBe(1);
    });
  });

  describe('onSearchChange()', () => {
    it('debe actualizar búsqueda y resetear página', () => {
      component.page.set(2);
      component.onSearchChange('marta');
      expect(component.search()).toBe('marta');
      expect(component.page()).toBe(1);
    });
  });

  describe('resetFilters()', () => {
    it('debe limpiar búsqueda y volver a página 1', () => {
      component.search.set('test');
      component.page.set(3);
      component.resetFilters();
      expect(component.search()).toBe('');
      expect(component.page()).toBe(1);
    });
  });

  describe('gestión de modales', () => {
    it('openCreateModal debe activar showCreateModal', () => {
      component.openCreateModal();
      expect(component.showCreateModal()).toBe(true);
      expect(component.showEditModal()).toBe(false);
      expect(component.employeeToEdit()).toBeNull();
    });

    it('openEditModal debe activar showEditModal con el empleado', () => {
      component.openEditModal(mockEmployees[0]);
      expect(component.showEditModal()).toBe(true);
      expect(component.showCreateModal()).toBe(false);
      expect(component.employeeToEdit()).toEqual(mockEmployees[0]);
    });

    it('openDeleteModal debe activar showDeleteModal con el empleado', () => {
      component.openDeleteModal(mockEmployees[1]);
      expect(component.showDeleteModal()).toBe(true);
      expect(component.employeeToDelete()).toEqual(mockEmployees[1]);
    });

    it('closeModals debe cerrar todos los modales', () => {
      component.openCreateModal();
      component.closeModals();
      expect(component.showCreateModal()).toBe(false);
      expect(component.showEditModal()).toBe(false);
      expect(component.showDeleteModal()).toBe(false);
      expect(component.employeeToEdit()).toBeNull();
      expect(component.employeeToDelete()).toBeNull();
    });

    it('cancelDelete debe cerrar modal de eliminación', () => {
      component.openDeleteModal(mockEmployees[0]);
      component.cancelDelete();
      expect(component.showDeleteModal()).toBe(false);
      expect(component.employeeToDelete()).toBeNull();
    });
  });

  describe('getShortText()', () => {
    it('debe truncar texto mayor a 35 caracteres', () => {
      const result = component.getShortText('Este texto es demasiado largo para mostrarlo completo');
      expect(result.length).toBeLessThanOrEqual(36);
      expect(result.endsWith('…')).toBe(true);
    });

    it('debe devolver texto corto sin modificar', () => {
      expect(component.getShortText('Texto corto')).toBe('Texto corto');
    });
  });
});
