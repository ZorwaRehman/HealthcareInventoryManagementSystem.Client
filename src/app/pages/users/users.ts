
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { User, UserRole } from '../../models/user.models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private document = inject(DOCUMENT);

  // Users and roles loaded from the backend.
  users: User[] = [];
  availableRoles: UserRole[] = [];

  // Search and filter.
  searchText = '';
  selectedRole = 'All Roles';

  // Page state.
  isLoading = false;
  errorMessage = '';
  updatingUserId: number | null = null;

  // User details modal.
  selectedUser: User | null = null;
  showDetailsModal = false;
  private previousBodyOverflow = '';

  // Three-dot action menu.
  openActionMenuId: number | null = null;

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  // Load registered users from the backend.
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);

        this.errorMessage =
          error.status === 401 || error.status === 403
            ? 'You are not authorized to view user management.'
            : 'Unable to load users. Please try again.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Load available roles from the backend.
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (response) => {
        this.availableRoles = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  // Search users and filter by role.
  get filteredUsers(): User[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter(user => {
      const fullName =
        `${user.firstName} ${user.lastName}`.toLowerCase();

      const matchesSearch =
        fullName.includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.roleName.toLowerCase().includes(search);

      const matchesRole =
        this.selectedRole === 'All Roles' ||
        user.roleName === this.selectedRole;

      return matchesSearch && matchesRole;
    });
  }

  // Summary card counts.
  get totalUsers(): number {
    return this.users.length;
  }

  get administrators(): number {
    return this.users.filter(
      user => user.roleName === 'Admin'
    ).length;
  }

  get storeManagers(): number {
    return this.users.filter(
      user => user.roleName === 'Store Manager'
    ).length;
  }

  get activeUsers(): number {
    return this.users.filter(
      user => user.isActive
    ).length;
  }

  // Generate initials for the user avatar.
  getInitials(user: User): string {
    return `${user.firstName} ${user.lastName}`
      .trim()
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  // Clear search and role filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = 'All Roles';
  }

  // Open or close a user's three-dot action menu.
  toggleActionMenu(userId: number, event: MouseEvent): void {
    event.stopPropagation();

    this.openActionMenuId =
      this.openActionMenuId === userId ? null : userId;
  }

  // Close the action menu.
  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Open the user details modal and hide background scrolling.
  viewUser(user: User): void {
    this.closeActionMenu();

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';

    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  // Close the modal and restore background scrolling.
  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;

    this.document.body.style.overflow = this.previousBodyOverflow;
  }

  // Restore scrolling if the component is destroyed.
  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
  }

  // Assign or change a user's role.
  assignRole(user: User, roleId: number): void {
    if (user.roleId === Number(roleId)) {
      return;
    }

    const selectedRole = this.availableRoles.find(
      role => role.id === Number(roleId)
    );

    if (!selectedRole) {
      alert('Please select a valid role.');
      return;
    }

    const previousRoleId = user.roleId;
    const previousRoleName = user.roleName;

    const confirmed = confirm(
      `Change ${user.firstName} ${user.lastName}'s role to ${selectedRole.name}?`
    );

    if (!confirmed) {
      this.cdr.detectChanges();
      return;
    }

    this.updatingUserId = user.id;

    this.userService.assignRole(user.id, Number(roleId)).subscribe({
      next: () => {
        user.roleId = Number(roleId);
        user.roleName = selectedRole.name;

        this.updatingUserId = null;
        this.closeActionMenu();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error assigning role:', error);

        user.roleId = previousRoleId;
        user.roleName = previousRoleName;

        this.updatingUserId = null;

        alert('Unable to update the user role. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // Activate or deactivate a user account.
  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const confirmed = confirm(
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName}'s account?`
    );

    if (!confirmed) {
      return;
    }

    this.updatingUserId = user.id;

    this.userService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        user.isActive = newStatus;

        this.updatingUserId = null;
        this.closeActionMenu();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating user status:', error);

        this.updatingUserId = null;

        alert('Unable to update account status. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  // Track table rows by user ID.
  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
