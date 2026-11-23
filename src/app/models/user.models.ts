
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserRole {
  id: number;
  name: string;
}

export interface AssignUserRoleRequest {
  roleId: number;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}
