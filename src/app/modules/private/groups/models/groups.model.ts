import { Employee } from "../../employees/models/employe.model";

export interface CreateGroupRq {
  name: string;
  address: string;
}

export interface Group {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string | null;
  employees: Employee[];
}

export interface GroupFormResult {
  group: Group;
  mode: 'create' | 'edit';
}
