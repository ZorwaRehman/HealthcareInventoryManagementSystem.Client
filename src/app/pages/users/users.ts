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

  // Users displayed on the current page.
  users: User[] = [];

  // All users are retained for accurate summary-card counts.
  private allUsers: User[] = [];

  availableRoles: UserRole[] = [];

  // Search and filter.
  searchText = '';
  selectedRole = 'All Roles';

  // Pagination.
  currentPage = 1;
  pageSize = 10;
  pageSizes = [5, 10, 20, 50];
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

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
    this.loadSummaryUsers();
    this.loadRoles();
  }

  // Load the current page from the backend.
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getPagedUsers(
      this.currentPage,
      this.pageSize,
      this.searchText,
      this.selectedRole
    ).subscribe({
      next: (response) => {
        this.users = response.items;
        this.totalCount = response.totalCount;
        this.currentPage = response.pageNumber;
        this.pageSize = response.pageSize;
        this.totalPages = response.totalPages;
        this.hasPreviousPage = response.hasPreviousPage;
        this.hasNextPage = response.hasNextPage;

        this.isLoading = false;
        this.closeActionMenu();
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

  // Load all users for the summary cards.
  loadSummaryUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.allUsers = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading user summary:', error);
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

  // Search users from the backend.
  onSearchChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  // Filter users by role from the backend.
  onRoleChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  // Change the selected page size.
  onPageSizeChange(newPageSize: number): void {
  this.pageSize = newPageSize;
  this.currentPage = 1;
  this.loadUsers();
}

  // Go to the previous page.
  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  // Go to the next page.
  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  // First record number displayed on the current page.
  get startRecord(): number {
    return this.totalCount === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  // Last record number displayed on the current page.
  get endRecord(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.totalCount
    );
  }

  // Keep the existing template's filteredUsers reference.
  get filteredUsers(): User[] {
    return this.users;
  }

  // Summary card counts.
  get totalUsers(): number {
    return this.allUsers.length;
  }

  get administrators(): number {
    return this.allUsers.filter(
      user => user.roleName === 'Admin'
    ).length;
  }

  get storeManagers(): number {
    return this.allUsers.filter(
      user => user.roleName === 'Store Manager'
    ).length;
  }

  get activeUsers(): number {
    return this.allUsers.filter(
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
    this.currentPage = 1;
    this.loadUsers();
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

        this.loadUsers();
        this.loadSummaryUsers();
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
        this.updatingUserId = null;
        this.closeActionMenu();

        this.loadUsers();
        this.loadSummaryUsers();
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