import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { inject } from '@angular/core';
import { CreateEmployeeRq, Employee } from '../models/employe.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  // Injected services
  private apiService = inject(ApiService);

  /**
   * Crea un nuevo empleado con los datos proporcionados
   * @param employee Datos del empleado a crear
   * @returns Observable con el empleado creado
   */
  createEmployee(employee: CreateEmployeeRq):Observable<Employee> {
    return this.apiService.post<Employee>('/employees', employee);
  }

  /**
   * Obtiene la lista de todos los empleados disponibles
   * @returns Observable con la lista de empleados
   */
  getAllEmployees(): Observable<Employee[]> {
    return this.apiService.get<Employee[]>('/employees');
  }

  /**
   * Obtiene un empleado por su ID
   * @param id ID del empleado a obtener
   * @returns Observable con el empleado correspondiente
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.apiService.get<Employee>(`/employees/${id}`);
  }

  /**
   * Actualiza un empleado existente con los datos proporcionados
   * @param id ID del empleado a actualizar
   * @param employee Datos del empleado a actualizar
   * @returns Observable con el empleado actualizado
   */
   updateEmployee(id: string, employee: Partial<CreateEmployeeRq>): Observable<Employee> {
    return this.apiService.put<Employee>(`/employees/${id}`, employee);
  }
  
  /**
   * Elimina un empleado por su ID
   * @param id ID del empleado a eliminar
   * @returns Observable vacío
   */
  deleteEmployee(id: string): Observable<void> {
    return this.apiService.delete<void>(`/employees/${id}`);
  }

}

