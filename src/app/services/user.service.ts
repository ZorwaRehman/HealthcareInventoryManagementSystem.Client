
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  User,
  UserRole,
  AssignUserRoleRequest,
  UpdateUserStatusRequest
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Users`;

  // Get all registered users.
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Get available roles.
  getRoles(): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(`${this.apiUrl}/roles`);
  }

  // Assign or change a user's role.
  assignRole(
    userId: number,
    roleId: number
  ): Observable<unknown> {
    const request: AssignUserRoleRequest = { roleId };

    return this.http.patch(
      `${this.apiUrl}/${userId}/role`,
      request
    );
  }

  // Activate or deactivate a user account.
  updateStatus(
    userId: number,
    isActive: boolean
  ): Observable<unknown> {
    const request: UpdateUserStatusRequest = { isActive };

    return this.http.patch(
      `${this.apiUrl}/${userId}/status`,
      request
    );
  }
}
