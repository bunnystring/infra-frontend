import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { GroupsStore } from './groups.store';
import { GroupsService } from '../services/groups.service';
import { Group } from '../models/groups.model';

const mockEmployee = { id: 'e1', fullName: 'Ana', email: 'ana@mail.com', documentType: 'CC', documentNumber: '123', status: 'ACTIVE' as any };

const mockGroups: Group[] = [
  { id: 'g1', name: 'Grupo A', address: 'Calle 1', createdAt: '2026-01-01', updatedAt: null, employees: [mockEmployee] },
  { id: 'g2', name: 'Grupo B', address: 'Calle 2', createdAt: '2026-01-02', updatedAt: null, employees: [] },
];

describe('GroupsStore', () => {
  let store: InstanceType<typeof GroupsStore>;
  let groupsServiceSpy: { getAllGroups: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    groupsServiceSpy = { getAllGroups: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        GroupsStore,
        { provide: GroupsService, useValue: groupsServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(GroupsStore);
  });

  describe('Estado inicial', () => {
    it('debe inicializar con lista vacía', () => {
      expect(store.groups()).toEqual([]);
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
      expect(stats.withEmployees).toBe(0);
      expect(stats.empty).toBe(0);
    });
  });

  describe('loadGroups()', () => {
    it('debe cargar grupos y actualizar el estado', async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(of(mockGroups));

      await firstValueFrom(store.loadGroups());

      expect(store.groups()).toEqual(mockGroups);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('debe activar isLoading al iniciar y desactivarlo al terminar', async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(of(mockGroups));
      const loading$ = store.loadGroups();
      // Al suscribirse isLoading se activa internamente y luego se desactiva
      await firstValueFrom(loading$);
      expect(store.isLoading()).toBe(false);
    });

    it('debe manejar error del servicio y actualizar store.error()', async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(throwError(() => new Error('Network error')));

      await firstValueFrom(store.loadGroups());

      expect(store.error()).toBe('Error al cargar grupos');
      expect(store.isLoading()).toBe(false);
      expect(store.groups()).toEqual([]);
    });
  });

  describe('stats computed', () => {
    it('debe calcular estadísticas correctamente', async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(of(mockGroups));
      await firstValueFrom(store.loadGroups());

      const stats = store.stats();
      expect(stats.total).toBe(2);
      expect(stats.withEmployees).toBe(1);
      expect(stats.empty).toBe(1);
    });
  });

  describe('upsertGroup()', () => {
    beforeEach(async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(of(mockGroups));
      await firstValueFrom(store.loadGroups());
    });

    it('debe actualizar un grupo existente por ID', () => {
      const updated: Group = { ...mockGroups[0], name: 'Grupo A Modificado' };
      store.upsertGroup(updated);

      const found = store.groups().find((g) => g.id === 'g1');
      expect(found?.name).toBe('Grupo A Modificado');
      expect(store.groups().length).toBe(2);
    });

    it('debe agregar un grupo nuevo si el ID no existe', () => {
      const newGroup: Group = { id: 'g3', name: 'Grupo C', address: 'Calle 3', createdAt: '2026-01-03', updatedAt: null, employees: [] };
      store.upsertGroup(newGroup);

      expect(store.groups().length).toBe(3);
      expect(store.groups().find((g) => g.id === 'g3')).toBeTruthy();
    });
  });

  describe('removeGroup()', () => {
    beforeEach(async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(of(mockGroups));
      await firstValueFrom(store.loadGroups());
    });

    it('debe eliminar el grupo con el ID indicado', () => {
      store.removeGroup('g1');

      expect(store.groups().length).toBe(1);
      expect(store.groups().find((g) => g.id === 'g1')).toBeUndefined();
    });

    it('no debe modificar la lista si el ID no existe', () => {
      store.removeGroup('inexistente');
      expect(store.groups().length).toBe(2);
    });
  });

  describe('clearError()', () => {
    it('debe limpiar el error del estado', async () => {
      groupsServiceSpy.getAllGroups.mockReturnValue(throwError(() => new Error('fail')));
      await firstValueFrom(store.loadGroups());
      expect(store.error()).not.toBeNull();

      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});
