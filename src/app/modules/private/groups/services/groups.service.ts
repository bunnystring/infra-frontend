import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { inject } from '@angular/core';
import { CreateGroupRq, Group } from '../models/groups.model';
import { Observable } from 'rxjs';
import { EmployeesAsignment } from '../../employees/models/employe.model';

/**
 * Servicio para gestionar grupos
 *
 * @since 2026-02-24
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  // Injected services
  private apiService = inject(ApiService);

  /**
   * Crea un nuevo grupo con los datos proporcionados
   * @param grupo Datos del grupo a crear
   * @returns Observable con el grupo creado
   */
  createGroup(grupo: Partial<CreateGroupRq>): Observable<Group> {
    return this.apiService.post<Group>('/groups', grupo);
  }

  /**
   * Obtiene un grupo por su ID
   * @param id
   * @returns Observable con el grupo obtenido
   */
  getGroupById(id: string): Observable<Group> {
    return this.apiService.get<Group>(`/groups/${id}`);
  }

  /**
   * Obtiene todos los grupos disponibles
   * @returns Observable con la lista de grupos
   */
   getAllGroups(): Observable<Group[]> {
    return this.apiService.get<Group[]>('/groups');
  }

  /**
   * Actualiza un grupo existente con los datos proporcionados
   * @param id ID del grupo a actualizar
   * @param group Datos del grupo a actualizar
   * @returns Observable con el grupo actualizado
   */
  updateGroup(id: string, group: Partial<CreateGroupRq>): Observable<Group> {
    return this.apiService.put<Group>(`/groups/${id}`, group);
  }

  /**
   * Elimina un grupo por su ID
   * @param id ID del grupo a eliminar
   * @returns void
   */
  deleteGroupById(id: string): Observable<void> {
    return this.apiService.delete<void>(`/groups/${id}`);
  }

  /**
   * Asigna empleados a un grupo específico
   * @param groupId ID del grupo al que se asignarán los empleados
   * @param employees Lista de empleados a asignar
   * @returns Observable con el grupo actualizado
   */
  assginEmployeesToGroup(groupId: string, employees: EmployeesAsignment): Observable<Group> {
    return this.apiService.post<Group>(`/groups/${groupId}/employees`, { employees });
  }

  /**
   * Elimina un empleado de un grupo específico
   * @param groupId ID del grupo del que se eliminará el empleado
   * @param employeId ID del empleado a eliminar
   * @returns Observable con el grupo actualizado
   */
  removeEmployeesFromGroup(groupId: string, employeId: string): Observable<Group> {
    return this.apiService.delete<Group>(`/groups/${groupId}/employees/${employeId}`);
  }

  /**
   * Obtiene los correos electrónicos de los miembros de un grupo específico
   * @param groupId ID del grupo del que se obtendrán los correos electrónicos de los miembros
   * @returns Observable con la lista de correos electrónicos de los miembros del grupo
   */
  getEmailsByGroup(groupId: string): Observable<string[]> {
    return this.apiService.get<string[]>(`/groups/${groupId}/members/emails`);
  }
}
