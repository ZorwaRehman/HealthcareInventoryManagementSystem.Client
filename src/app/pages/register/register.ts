
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  message = '';
  messageType: 'success' | 'error' = 'error';
  isLoading = false;

  onRegister(): void {
    this.message = '';

    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.message = 'Please complete all fields.';
      this.messageType = 'error';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()))  {
      this.message = 'Please enter a valid email address.';
      this.messageType = 'error';
      return;
    }

    if (this.password.length < 8) {
      this.message = 'Password must contain at least 8 characters.';
      this.messageType = 'error';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;

    this.authService.register({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.message = 'Registration successful! Redirecting to login...';
        this.messageType = 'success';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.message =
            'Cannot connect to the server. Check that the API is running.';
        } else if (error.status === 400 || error.status === 409) {
          this.message =
            error.error?.message ||
            'Registration failed. The email may already be registered or the details may be invalid.';
        } else {
          this.message =
            error.error?.message ||
            'Registration failed. Please try again.';
        }

        this.messageType = 'error';
      },
    });
  }
}
