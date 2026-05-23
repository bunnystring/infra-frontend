export interface Employee {
  id: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  status: EmployeeStatus;
}

export interface CreateEmployeeRq {
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  status: EmployeeStatus;
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface EmployeesAsignment {
  employeesId: string[];
}

export interface EmployeeFormResult {
  employee: Employee;
  mode: 'create' | 'edit';
}
