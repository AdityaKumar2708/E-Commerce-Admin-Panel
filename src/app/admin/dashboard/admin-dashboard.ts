
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';


interface DashboardProduct {
    id: number;
    name?: string;
    category?: string;
}

interface DashboardOrder {
    id: number | string;
    orderNumber?: string;
    customerName?: string;
    customerEmail?: string;
    createdAt?: string;
    totalAmount?: number | string;
    orderStatus?: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.html',
    styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {

    adminName = localStorage.getItem('fullName') || 'Admin';

    totalProducts = 0;
    totalOrders = 0;
    totalCustomers = 0;
    totalCategories = 0;

    loading = true;
    dashboardError = '';

    recentOrders: {
        id: number | string;
        customerName: string;
        date: string;
        amount: number;
        status: string;
    }[] = [];

    private readonly baseUrl = 'https://e-commerce-backend-kyir.onrender.com';

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadDashboard();
    }

    loadDashboard(): void {
        this.loading = true;
        this.dashboardError = '';

        const token = localStorage.getItem('authToken');

        const headers = token
            ? new HttpHeaders({ Authorization: `Bearer ${token}` })
            : undefined;

        // PRODUCTS
        this.http.get<any>(`${this.baseUrl}/api/products`).subscribe({
            next: (response) => {
                const products: DashboardProduct[] = Array.isArray(response)
                    ? response
                    : response?.content ?? response?.data ?? [];

                this.totalProducts = products.length;
                console.log('Dashboard Products API:', response);

                this.totalCategories = new Set(
                    products
                        .map(product => product.category?.trim().toLowerCase())
                        .filter((category): category is string => !!category)
                ).size;
            },
            error: (error) => {
                console.error('Dashboard products error:', error);
                this.dashboardError =
                    'Products/categories could not be loaded. Check the API.';
            }
        });

        // ORDERS
        this.http.get<any>(
            `${this.baseUrl}/api/admin/orders`,
            headers ? { headers } : {}
        ).subscribe({
            next: (response) => {
                const orders: DashboardOrder[] = Array.isArray(response)
                    ? response
                    : response?.content ?? response?.data ?? [];

                this.totalOrders = orders.length;
                console.log('Dashboard Orders API:', response);

                // Count distinct customers who have placed orders.
                this.totalCustomers = new Set(
                    orders
                        .map(order => order.customerEmail?.trim().toLowerCase())
                        .filter((email): email is string => !!email)
                ).size;

                this.recentOrders = [...orders]
                    .sort((a, b) =>
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                    )
                    .slice(0, 5)
                    .map(order => ({
                        id: order.id,
                        customerName: order.customerName || 'Customer',
                        date: order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-IN')
                            : '—',
                        amount: Number(order.totalAmount) || 0,
                        status: order.orderStatus || 'PENDING'
                    }));

                this.loading = false;
            },
            error: (error) => {
                console.error('Dashboard orders error:', error);
                this.dashboardError =
                    'Orders could not be loaded. Check admin login and API access.';
                this.loading = false;
            }
        });
    }

    navigateTo(path: string): void {
        this.router.navigateByUrl(path);
    }

    viewOrder(orderId: number | string): void {
        this.router.navigate(['/admin/orders', orderId]);
    }

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        localStorage.removeItem('email');
        localStorage.removeItem('role');

        this.router.navigateByUrl('/admin/login');
    }
}
