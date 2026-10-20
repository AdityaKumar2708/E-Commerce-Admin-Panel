
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, AuthResponse } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  onSubmit(): void {
    console.log('1. Submit triggered');

    this.errorMessage = '';

    const email = this.email.trim().toLowerCase();

    console.log('2. Email entered:', email);
    console.log('3. Password entered:', !!this.password);

    if (!email || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      console.log('Validation failed');
      return;
    }

    if (this.isLoading) {
      console.log('Already loading');
      return;
    }

    this.isLoading = true;

    console.log('4. Calling adminLogin API');

    this.authService.adminLogin({
      email,
      password: this.password
    }).subscribe({
      next: (response: AuthResponse) => {
        console.log('5. API SUCCESS:', response);

        if (!response?.token || response.role !== 'ADMIN') {
          this.isLoading = false;
          this.errorMessage = 'Admin authentication failed.';
          return;
        }

        localStorage.setItem('authToken', response.token);
        localStorage.setItem('tokenType', response.tokenType || 'Bearer');
        localStorage.setItem('userId', String(response.userId));
        localStorage.setItem('fullName', response.fullName || '');
        localStorage.setItem('email', response.email || email);
        localStorage.setItem('role', response.role);

        this.password = '';
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = returnUrl?.startsWith('/admin/') && !returnUrl.startsWith('//') ? returnUrl : '/admin/dashboard';
        this.router.navigateByUrl(target);
      },
      error: (error: HttpErrorResponse) => {
        console.error('5. API ERROR:', error);
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  goToForgotPassword(): void {
    console.log('Forgot password clicked');

    this.router.navigateByUrl('/admin/forgot-password')
      .then((success) => {
        console.log('Navigation success:', success);
        console.log('Current URL:', this.router.url);
      })
      .catch((error) => {
        console.error('Navigation error:', error);
      });
  }
}
