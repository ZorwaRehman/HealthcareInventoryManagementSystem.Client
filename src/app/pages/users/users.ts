
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users {
  searchText = '';
  selectedRole = 'All Roles';

  showForm = false;
  isEditing = false;
  selectedUserId: number | null = null;

  userForm: User = this.createEmptyUser();

  users: User[] = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@healthcareims.com',
      role: 'Administrator',
      status: 'Active',
      lastLogin: 'Apr 28, 2025 10:24 AM'
    },
    {
      id: 2,
      name: 'Dr. Sarah Johnson',
      email: 'dr.sarah@healthcareims.com',
      role: 'Doctor',
      status: 'Active',
      lastLogin: 'Apr 27, 2025 03:12 PM'
    },
    {
      id: 3,
      name: 'Nurse Emily Davis',
      email: 'nurse.emily@healthcareims.com',
      role: 'Nurse',
      status: 'Active',
      lastLogin: 'Apr 26, 2025 11:45 AM'
    },
    {
      id: 4,
      name: 'Pharmacist Michael Brown',
      email: 'pharmacist.michael@healthcareims.com',
      role: 'Pharmacist',
      status: 'Active',
      lastLogin: 'Apr 25, 2025 04:20 PM'
    },
    {
      id: 5,
      name: 'Store Manager Lisa Wilson',
      email: 'store.lisa@healthcareims.com',
      role: 'Store Manager',
      status: 'Active',
      lastLogin: 'Apr 24, 2025 09:18 AM'
    },
    {
      id: 6,
      name: 'Accountant James Taylor',
      email: 'accountant.james@healthcareims.com',
      role: 'Accountant',
      status: 'Active',
      lastLogin: 'Apr 23, 2025 02:37 PM'
    }
  ];

  roles: string[] = [
    'All Roles',
    'Administrator',
    'Doctor',
    'Nurse',
    'Pharmacist',
    'Store Manager',
    'Accountant'
  ];

  // Search users and filter by role
  get filteredUsers(): User[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search);

      const matchesRole =
        this.selectedRole === 'All Roles' ||
        user.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });
  }

  // Summary card counts
  get totalUsers(): number {
    return this.users.length;
  }

  get administrators(): number {
    return this.users.filter(
      user => user.role === 'Administrator'
    ).length;
  }

  get doctors(): number {
    return this.users.filter(
      user => user.role === 'Doctor'
    ).length;
  }

  get otherRoles(): number {
    return this.users.filter(
      user => user.role !== 'Administrator'
    ).length;
  }

  // Create an empty user
  createEmptyUser(): User {
    return {
      id: 0,
      name: '',
      email: '',
      role: 'Doctor',
      status: 'Active',
      lastLogin: 'Never'
    };
  }

  // Open Add User form
  openAddForm(): void {
    this.isEditing = false;
    this.selectedUserId = null;
    this.userForm = this.createEmptyUser();
    this.showForm = true;
  }

  // Open Edit User form
  editUser(user: User): void {
    this.isEditing = true;
    this.selectedUserId = user.id;
    this.userForm = { ...user };
    this.showForm = true;
  }

  // Save a new user or update an existing user
  saveUser(): void {
    const name = this.userForm.name.trim();
    const email = this.userForm.email.trim().toLowerCase();

    if (!name || !email || !email.includes('@')) {
      alert('Please enter a valid name and email address.');
      return;
    }

    const duplicateEmail = this.users.some(user =>
      user.email.toLowerCase() === email &&
      user.id !== this.selectedUserId
    );

    if (duplicateEmail) {
      alert('A user with this email address already exists.');
      return;
    }

    if (this.isEditing && this.selectedUserId !== null) {
      this.users = this.users.map(user =>
        user.id === this.selectedUserId
          ? { ...this.userForm, name, email }
          : user
      );
    } else {
      const newId =
        Math.max(0, ...this.users.map(user => user.id)) + 1;

      this.users = [
        ...this.users,
        {
          ...this.userForm,
          id: newId,
          name,
          email
        }
      ];
    }

    this.closeForm();
  }

  // Delete a user
  deleteUser(user: User): void {
    const confirmed = confirm(`Delete ${user.name}?`);

    if (confirmed) {
      this.users = this.users.filter(
        item => item.id !== user.id
      );
    }
  }

  // View user details
  viewUser(user: User): void {
    alert(
      `Name: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `Role: ${user.role}\n` +
      `Status: ${user.status}`
    );
  }

  // Close the Add/Edit form
  closeForm(): void {
    this.showForm = false;
    this.userForm = this.createEmptyUser();
    this.selectedUserId = null;
    this.isEditing = false;
  }

  // Generate initials for the user avatar
  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  // Track rows by user ID
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  // Demo logout button
  logoutNotice(): void {
    alert('Logout is a demo feature for now.');
  }
}
