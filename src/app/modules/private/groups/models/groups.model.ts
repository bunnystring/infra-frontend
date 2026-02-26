import { Employee } from "../../employees/models/employe.model";

/**
 * Modelo de creacion de grupo
 */
export interface CreateGroupRq {
  name: string;
  address: string;
}

/**
 * Modelo que representa un grupo
 */
export interface Group {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string | null;
  employees: Employee[];
}
