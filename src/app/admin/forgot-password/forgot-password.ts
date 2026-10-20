
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';

@Component({
    selector: 'app-admin-forgot-password',
    standalone: true,
    imports: [FormsModule, RouterLink],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.scss'
})
export class AdminForgotPassword {
    email = '';
    otp = '';
    newPassword = '';
    confirmPassword = '';

    otpSent = false;
    showPassword = false;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    sendOtp(): void {
        this.errorMessage = '';
        this.successMessage = '';

        const normalizedEmail = this.email.trim().toLowerCase();

        if (!normalizedEmail) {
            this.errorMessage = 'Please enter your email address.';
            return;
        }

        if (this.isLoading) {
            return;
        }

        this.email = normalizedEmail;
        this.isLoading = true;

        console.log('Sending admin reset OTP to:', normalizedEmail);

        this.authService.sendAdminResetOtp(normalizedEmail).subscribe({
            next: (response) => {
                console.log('OTP API SUCCESS:', response);

                this.isLoading = false;
                this.otpSent = true;
                this.successMessage =
                    response?.message ||
                    'If the admin account exists, an OTP has been sent.';

                // Refresh the view so the OTP form is rendered.
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse) => {
                console.error('OTP API ERROR:', error);
                console.error('HTTP STATUS:', error.status);
                console.error('ERROR RESPONSE:', error.error);

                this.isLoading = false;
                this.errorMessage =
                    error.error?.message ||
                    'Unable to send OTP. Please try again.';

                this.cdr.detectChanges();
            }
        });
    }

    resetPassword(): void {
        this.errorMessage = '';
        this.successMessage = '';

        const normalizedEmail = this.email.trim().toLowerCase();
        const normalizedOtp = this.otp.trim();

        if (!normalizedEmail) {
            this.errorMessage = 'Email address is missing.';
            return;
        }

        if (!/^\d{6}$/.test(normalizedOtp)) {
            this.errorMessage = 'Please enter the 6-digit OTP.';
            return;
        }

        if (this.newPassword.length < 8) {
            this.errorMessage = 'Password must be at least 8 characters long.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match.';
            return;
        }

        if (this.isLoading) {
            return;
        }

        this.isLoading = true;

        console.log('Calling admin password reset API');

        this.authService.resetAdminPassword({
            email: normalizedEmail,
            otp: normalizedOtp,
            newPassword: this.newPassword
        }).subscribe({
            next: (response) => {
                console.log('RESET PASSWORD SUCCESS:', response);

                this.isLoading = false;
                this.successMessage =
                    response?.message || 'Password reset successfully.';

                this.otp = '';
                this.newPassword = '';
                this.confirmPassword = '';

                this.cdr.detectChanges();

                setTimeout(() => {
                    this.router.navigateByUrl('/admin/login');
                }, 1500);
            },
            error: (error: HttpErrorResponse) => {
                console.error('RESET PASSWORD ERROR:', error);
                console.error('HTTP STATUS:', error.status);
                console.error('ERROR RESPONSE:', error.error);

                this.isLoading = false;
                this.errorMessage =
                    error.error?.message ||
                    'Password reset failed. Please try again.';

                this.cdr.detectChanges();
            }
        });
    }

    changeEmail(): void {
        this.otpSent = false;
        this.otp = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.errorMessage = '';
        this.successMessage = '';
        this.showPassword = false;
    }
}
