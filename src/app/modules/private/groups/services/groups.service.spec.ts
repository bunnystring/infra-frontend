import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GroupsService } from './groups.service';
import { Group, CreateGroupRq } from '../models/groups.model';
import { EmployeeStatus } from '../../employees/models/employe.model';
import { environment } from '../../../../../environments/environment';

const BASE = environment.apiUrl;

const mockEmployee = { id: 'e1', fullName: 'Ana', email: 'ana@mail.com', documentType: 'CC', documentNumber: '111', status: EmployeeStatus.ACTIVE };

const mockGroup: Group = {
  id: 'g1',
  name: 'Grupo Test',
  address: 'Calle 123',
  createdAt: '2026-01-01',
  updatedAt: null,
  employees: [mockEmployee],
};

describe('GroupsService', () => {
  let service: GroupsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GroupsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(GroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllGroups()', () => {
    it('debe hacer GET /groups y devolver lista', () => {
      service.getAllGroups().subscribe((groups) => {
        expect(groups.length).toBe(1);
        expect(groups[0].id).toBe('g1');
      });

      const req = httpMock.expectOne(`${BASE}/groups`);
      expect(req.request.method).toBe('GET');
      req.flush([mockGroup]);
    });
  });

  describe('getGroupById()', () => {
    it('debe hacer GET /groups/:id y devolver el grupo', () => {
      service.getGroupById('g1').subscribe((group) => {
        expect(group.id).toBe('g1');
        expect(group.name).toBe('Grupo Test');
      });

      const req = httpMock.expectOne(`${BASE}/groups/g1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGroup);
    });
  });

  describe('createGroup()', () => {
    it('debe hacer POST /groups con los datos correctos', () => {
      const payload: Partial<CreateGroupRq> = { name: 'Nuevo Grupo', address: 'Av. Nueva' };

      service.createGroup(payload).subscribe((group) => {
        expect(group.name).toBe('Nuevo Grupo');
      });

      const req = httpMock.expectOne(`${BASE}/groups`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockGroup, ...payload });
    });
  });

  describe('updateGroup()', () => {
    it('debe hacer PUT /groups/:id con los datos correctos', () => {
      const payload: Partial<CreateGroupRq> = { name: 'Grupo Actualizado' };

      service.updateGroup('g1', payload).subscribe((group) => {
        expect(group.name).toBe('Grupo Actualizado');
      });

      const req = httpMock.expectOne(`${BASE}/groups/g1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...mockGroup, name: 'Grupo Actualizado' });
    });
  });

  describe('deleteGroupById()', () => {
    it('debe hacer DELETE /groups/:id', () => {
      service.deleteGroupById('g1').subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${BASE}/groups/g1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('removeEmployeesFromGroup()', () => {
    it('debe hacer DELETE /groups/:groupId/employees/:employeeId', () => {
      service.removeEmployeesFromGroup('g1', 'e1').subscribe((group) => {
        expect(group).toBeTruthy();
      });

      const req = httpMock.expectOne(`${BASE}/groups/g1/employees/e1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ ...mockGroup, employees: [] });
    });
  });

  describe('getEmailsByGroup()', () => {
    it('debe hacer GET /groups/:groupId/members/emails', () => {
      const emails = ['ana@mail.com'];

      service.getEmailsByGroup('g1').subscribe((result) => {
        expect(result).toEqual(emails);
      });

      const req = httpMock.expectOne(`${BASE}/groups/g1/members/emails`);
      expect(req.request.method).toBe('GET');
      req.flush(emails);
    });
  });
});
