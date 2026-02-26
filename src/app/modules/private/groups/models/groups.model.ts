export interface CreateGroupRq {
  name: string;
  address: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string | null;
}
