
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

interface AdminOrder {
  id: number;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt?: string;
  totalAmount?: number | string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  active: boolean;
  isNew: boolean;
  lastOrderDate: number;
  firstOrderDate: number;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './customers.html',
  styleUrl: './customers.scss'
})
export class Customers implements OnInit {

  private readonly apiUrl =
    'https://e-commerce-backend-kyir.onrender.com/api/admin/orders';

  searchText = '';
  customers: Customer[] = [];

  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get activeCustomers(): number {
    return this.customers.filter(customer => customer.active).length;
  }

  get newCustomers(): number {
    return this.customers.filter(customer => customer.isNew).length;
  }

  get filteredCustomers(): Customer[] {
    const search = this.searchText.trim().toLowerCase();

    return this.customers.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone.toLowerCase().includes(search)
    );
  }

  loadCustomers(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.errorMessage = 'Please log in with your admin account.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        console.log('Customers page - orders response:', response);

        const orders: AdminOrder[] = Array.isArray(response)
          ? response
          : response?.content ?? response?.data ?? [];

        this.buildCustomers(orders);
        this.loading = false;
      },
      error: (error) => {
        console.error('Unable to load customers:', error);

        this.customers = [];
        this.loading = false;

        this.errorMessage =
          error.status === 401 || error.status === 403
            ? 'Admin access denied. Please log in again.'
            : 'Unable to load customer data. Check the backend connection.';
      }
    });
  }

  private buildCustomers(orders: AdminOrder[]): void {
    const customerMap = new Map<string, Customer>();

    for (const order of orders) {
      const email = (order.customerEmail || '').trim().toLowerCase();
      const phone = (order.customerPhone || '').trim();
      const name = (order.customerName || '').trim();

      // Prefer email, then phone; use name only if both are missing.
      const key = email
        ? `email:${email}`
        : phone
          ? `phone:${phone}`
          : name
            ? `name:${name.toLowerCase()}`
            : '';

      if (!key) {
        continue;
      }

      const parsedDate = order.createdAt
        ? new Date(order.createdAt).getTime()
        : 0;

      const orderDate = Number.isFinite(parsedDate) ? parsedDate : 0;
      const amount = Number(order.totalAmount) || 0;

      const existing = customerMap.get(key);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += amount;

        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate;
          existing.name = name || existing.name;
          existing.email = email || existing.email;
          existing.phone = phone || existing.phone;
        }

        if (orderDate && (
          !existing.firstOrderDate ||
          orderDate < existing.firstOrderDate
        )) {
          existing.firstOrderDate = orderDate;
        }
      } else {
        customerMap.set(key, {
          id: key,
          name: name || 'Customer',
          email,
          phone,
          totalOrders: 1,
          totalSpent: amount,
          active: false,
          isNew: false,
          lastOrderDate: orderDate,
          firstOrderDate: orderDate
        });
      }
    }

    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    this.customers = Array.from(customerMap.values())
      .map(customer => ({
        ...customer,
        active: customer.lastOrderDate > 0 &&
          now - customer.lastOrderDate <= ninetyDays,
        isNew: customer.firstOrderDate > 0 &&
          now - customer.firstOrderDate <= thirtyDays
      }))
      .sort((a, b) => b.lastOrderDate - a.lastOrderDate);
  }

  formatLastOrder(timestamp: number): string {
    return timestamp
      ? new Date(timestamp).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : '—';
  }
}
