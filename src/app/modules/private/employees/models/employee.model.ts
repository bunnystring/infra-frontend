/**
 * Modelo que representa un empleado
 */
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  status: EmployeeStatus;
}

/**
 * Request para crear un nuevo empleado
 */
export interface CreateEmployeeRq {
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  status: EmployeeStatus;
}

/**
 * Modelo que representa los estados posibles de un empleado
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Request para asignar empleados a un grupo
 */
export interface EmployeesAsignment {
  employeesId: string[];
}

/**
 * Resultado del modal de creación/edición de un empleado
 */
export interface EmployeeFormResult {
  employee: Employee;
  mode: 'create' | 'edit';
}
