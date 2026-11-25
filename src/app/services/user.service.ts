import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  User,
  UserRole,
  AssignUserRoleRequest,
  UpdateUserStatusRequest
} from '../models/user.models';

export interface PaginatedUsersResponse {
  items: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Users`;

  // Get all registered users for summary-card counts.
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Get users using backend pagination, search and role filtering.
  getPagedUsers(
    pageNumber: number,
    pageSize: number,
    search?: string,
    role?: string
  ): Observable<PaginatedUsersResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (role && role !== 'All Roles') {
      params = params.set('role', role);
    }

    return this.http.get<PaginatedUsersResponse>(
      `${this.apiUrl}/paged`,
      { params }
    );
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