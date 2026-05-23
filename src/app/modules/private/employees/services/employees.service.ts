import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { inject } from '@angular/core';
import { CreateEmployeeRq, Employee } from '../models/employee.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  // Injected services
  private apiService = inject(ApiService);

  createEmployee(employee: CreateEmployeeRq):Observable<Employee> {
    return this.apiService.post<Employee>('/employees', employee);
  }

  getAllEmployees(): Observable<Employee[]> {
    return this.apiService.get<Employee[]>('/employees');
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.apiService.get<Employee>(`/employees/${id}`);
  }

  updateEmployee(id: string, employee: Partial<CreateEmployeeRq>): Observable<Employee> {
    return this.apiService.put<Employee>(`/employees/${id}`, employee);
  }
  
  deleteEmployee(id: string): Observable<void> {
    return this.apiService.delete<void>(`/employees/${id}`);
  }

}

