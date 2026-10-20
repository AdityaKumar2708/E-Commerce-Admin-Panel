
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminLoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    tokenType: string;
    userId: number;
    fullName: string;
    email: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private baseUrl = 'http://10.96.110.94:8080/api/auth';

    constructor(private http: HttpClient) { }

    // ADMIN LOGIN
    adminLogin(data: AdminLoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.baseUrl}/admin/login`,
            data
        );
    }

    sendAdminResetOtp(email: string) {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/admin/forgot-password`,
            { email }
        );
    }

    resetAdminPassword(request: {
        email: string;
        otp: string;
        newPassword: string;
    }) {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/admin/reset-password`,
            request
        );
    }

    hasValidAdminSession(): boolean {
        if (typeof localStorage === 'undefined') return false;
        const token = localStorage.getItem('authToken');
        if (!token || localStorage.getItem('role') !== 'ADMIN') return false;
        try {
            const part = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
            if (!part) return false;
            const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '='))) as { exp?: number };
            return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    clearSession(): void {
        if (typeof localStorage === 'undefined') return;
        ['authToken', 'tokenType', 'userId', 'fullName', 'email', 'role'].forEach(key => localStorage.removeItem(key));
    }
}
