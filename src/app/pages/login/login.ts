
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  message = '';
  messageType: 'success' | 'error' = 'error';
  isLoading = false;

  onLogin(): void {
    this.message = '';

    if (!this.email.trim() || !this.password) {
      this.message = 'Please enter your email and password.';
      this.messageType = 'error';
      return;
    }

    // Validate the email address format.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.message = 'Please enter a valid email address.';
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password,
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = 'Login successful!';
        this.messageType = 'success';

        // Navigate to the dashboard after successful login.
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          this.message = 'Invalid email or password.';
        } else if (error.status === 0) {
          this.message =
            'Cannot connect to the server. Check that the API is running.';
        } else {
          this.message =
            error.error?.message || 'Login failed. Please try again.';
        }

        this.messageType = 'error';
      },
    });
  }
}
