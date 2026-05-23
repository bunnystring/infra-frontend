import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { inject } from '@angular/core';
import { CreateGroupRq, Group } from '../models/groups.model';
import { Observable } from 'rxjs';
import { EmployeesAsignment } from '../../employees/models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  // Injected services
  private apiService = inject(ApiService);

  createGroup(grupo: Partial<CreateGroupRq>): Observable<Group> {
    return this.apiService.post<Group>('/groups', grupo);
  }

  getGroupById(id: string): Observable<Group> {
    return this.apiService.get<Group>(`/groups/${id}`);
  }

  getAllGroups(): Observable<Group[]> {
    return this.apiService.get<Group[]>('/groups');
  }

  updateGroup(id: string, group: Partial<CreateGroupRq>): Observable<Group> {
    return this.apiService.put<Group>(`/groups/${id}`, group);
  }

  deleteGroupById(id: string): Observable<void> {
    return this.apiService.delete<void>(`/groups/${id}`);
  }

  assginEmployeesToGroup(groupId: string, employees: EmployeesAsignment): Observable<Group> {
    return this.apiService.post<Group>(`/groups/${groupId}/employees`, { employees });
  }

  removeEmployeesFromGroup(groupId: string, employeId: string): Observable<Group> {
    return this.apiService.delete<Group>(`/groups/${groupId}/employees/${employeId}`);
  }

  getEmailsByGroup(groupId: string): Observable<string[]> {
    return this.apiService.get<string[]>(`/groups/${groupId}/members/emails`);
  }
}
