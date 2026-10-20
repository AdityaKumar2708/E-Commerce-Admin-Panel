import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {

  private router = inject(Router);

  adminName = 'Admin';

  constructor() {
    // Retrieve admin name from saved login data, if available.
    const savedName = localStorage.getItem('adminName');

    if (savedName) {
      this.adminName = savedName;
    }
  }

  logout(): void {
    // Clear saved authentication data.
    localStorage.removeItem('token');
    localStorage.removeItem('adminName');
    localStorage.removeItem('user');

    // Navigate to login page.
    this.router.navigate(['/admin/login']);
  }
}