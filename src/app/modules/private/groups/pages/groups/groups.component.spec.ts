import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { GroupsComponent } from './groups.component';
import { GroupsStore } from '../../store/groups.store';
import { GroupsService } from '../../services/groups.service';
import { Group } from '../../models/groups.model';
import { EmployeeStatus } from '../../../employees/models/employe.model';

const mockEmployee = { id: 'e1', fullName: 'Ana', email: 'ana@mail.com', documentType: 'CC', documentNumber: '111', status: EmployeeStatus.ACTIVE };

const mockGroups: Group[] = [
  { id: 'g1', name: 'Grupo Alpha', address: 'Av. Siempre Viva', createdAt: '2026-01-01', updatedAt: null, employees: [mockEmployee] },
  { id: 'g2', name: 'Grupo Beta', address: 'Calle Falsa', createdAt: '2026-01-02', updatedAt: null, employees: [] },
  { id: 'g3', name: 'Grupo Gamma', address: 'Boulevard Norte', createdAt: '2026-01-03', updatedAt: null, employees: [] },
];

describe('GroupsComponent', () => {
  let component: GroupsComponent;
  let fixture: ComponentFixture<GroupsComponent>;
  let groupsServiceSpy: jasmine.SpyObj<GroupsService>;

  beforeEach(async () => {
    groupsServiceSpy = jasmine.createSpyObj('GroupsService', ['getAllGroups']);
    groupsServiceSpy.getAllGroups.and.returnValue(of(mockGroups));

    await TestBed.configureTestingModule({
      imports: [GroupsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        GroupsStore,
        { provide: GroupsService, useValue: groupsServiceSpy },
      ],
    }).compileComponents();

    // Pre-carga el store como lo haría el resolver
    const store = TestBed.inject(GroupsStore);
    await store.loadGroups().toPromise();

    fixture = TestBed.createComponent(GroupsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('filteredGroups()', () => {
    it('debe devolver todos los grupos cuando no hay búsqueda', () => {
      expect(component.filteredGroups().length).toBe(3);
    });

    it('debe filtrar por nombre', () => {
      component.search.set('alpha');
      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].name).toBe('Grupo Alpha');
    });

    it('debe filtrar por dirección', () => {
      component.search.set('boulevard');
      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].name).toBe('Grupo Gamma');
    });

    it('debe ser insensible a mayúsculas', () => {
      component.search.set('BETA');
      expect(component.filteredGroups().length).toBe(1);
    });

    it('debe devolver lista vacía si no hay coincidencias', () => {
      component.search.set('xyz999');
      expect(component.filteredGroups().length).toBe(0);
    });
  });

  describe('filteredStats()', () => {
    it('debe calcular estadísticas de los grupos filtrados', () => {
      const stats = component.filteredStats();
      expect(stats.total).toBe(3);
      expect(stats.withEmployees).toBe(1);
      expect(stats.empty).toBe(2);
    });

    it('debe recalcular stats al cambiar el filtro', () => {
      component.search.set('alpha');
      const stats = component.filteredStats();
      expect(stats.total).toBe(1);
      expect(stats.withEmployees).toBe(1);
      expect(stats.empty).toBe(0);
    });
  });

  describe('paginación', () => {
    it('totalItems debe reflejar los grupos filtrados', () => {
      expect(component.totalItems()).toBe(3);
    });

    it('pagedGroups debe respetar el tamaño de página', () => {
      component.pageSize.set(2);
      expect(component.pagedGroups().length).toBe(2);
    });

    it('goToPage debe actualizar la página actual', () => {
      component.pageSize.set(2);
      component.goToPage(2);
      expect(component.page()).toBe(2);
    });

    it('nextPage no debe superar el total de páginas', () => {
      component.pageSize.set(2);
      component.goToPage(2); // última página con 2 items por página
      component.nextPage();
      expect(component.page()).toBe(2);
    });

    it('previousPage no debe bajar de la página 1', () => {
      component.previousPage();
      expect(component.page()).toBe(1);
    });
  });

  describe('onSearchChange()', () => {
    it('debe actualizar la búsqueda y resetear la página', () => {
      component.goToPage(2);
      component.onSearchChange('alpha');
      expect(component.search()).toBe('alpha');
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
      expect(component.showCreateModal()).toBeTrue();
      expect(component.showEditModal()).toBeFalse();
      expect(component.groupToEdit()).toBeNull();
    });

    it('openEditModal debe activar showEditModal con el grupo', () => {
      component.openEditModal(mockGroups[0]);
      expect(component.showEditModal()).toBeTrue();
      expect(component.showCreateModal()).toBeFalse();
      expect(component.groupToEdit()).toEqual(mockGroups[0]);
    });

    it('openDeleteModal debe activar showDeleteModal con el grupo', () => {
      component.openDeleteModal(mockGroups[1]);
      expect(component.showDeleteModal()).toBeTrue();
      expect(component.groupToDelete()).toEqual(mockGroups[1]);
    });

    it('closeModals debe cerrar todos los modales', () => {
      component.openCreateModal();
      component.closeModals();
      expect(component.showCreateModal()).toBeFalse();
      expect(component.showEditModal()).toBeFalse();
      expect(component.showDeleteModal()).toBeFalse();
      expect(component.groupToEdit()).toBeNull();
      expect(component.groupToDelete()).toBeNull();
    });

    it('cancelDelete debe cerrar modal de eliminación', () => {
      component.openDeleteModal(mockGroups[0]);
      component.cancelDelete();
      expect(component.showDeleteModal()).toBeFalse();
      expect(component.groupToDelete()).toBeNull();
    });
  });

  describe('getShortText()', () => {
    it('debe truncar texto largo', () => {
      const result = component.getShortText('Este es un texto muy largo que debe ser truncado');
      expect(result.length).toBeLessThanOrEqual(31); // 30 chars + '…'
      expect(result.endsWith('…')).toBeTrue();
    });

    it('debe devolver texto corto sin truncar', () => {
      const result = component.getShortText('Texto corto');
      expect(result).toBe('Texto corto');
    });
  });
});
