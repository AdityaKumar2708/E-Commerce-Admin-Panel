
import { Routes } from '@angular/router';

import { AdminLayout } from './admin/admin-layout/admin-layout';
import { AdminDashboard } from './admin/dashboard/admin-dashboard';
import { ProductList } from './admin/product-list/product-list';
import { ProductForm } from './admin/product-form/product-form';
import { Orders } from './admin/orders/orders';
import { Customers } from './admin/customers/customers';
import { Categories } from './admin/categories/categories';
import { Settings } from './admin/settings/settings';

import { AdminLogin } from './admin/auth/admin-login/admin-login';
import { adminAuthGuard } from './admin/auth/admin-auth.guard';
import { AdminForgotPassword } from './admin/forgot-password/forgot-password';

export const routes: Routes = [

    // ADMIN LOGIN
    {
        path: 'admin/login',
        component: AdminLogin
    },

    // ADMIN FORGOT PASSWORD
    {
        path: 'admin/forgot-password',
        component: AdminForgotPassword
    },

    // ADMIN PANEL - PROTECTED ROUTES
    {
        path: 'admin',
        component: AdminLayout,
        canActivate: [adminAuthGuard],
        canActivateChild: [adminAuthGuard],
        children: [

            // DEFAULT ADMIN ROUTE
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },

            // DASHBOARD
            {
                path: 'dashboard',
                component: AdminDashboard
            },

            // PRODUCTS
            {
                path: 'products',
                component: ProductList
            },
            {
                path: 'products/add',
                component: ProductForm
            },
            {
                path: 'products/edit/:id',
                component: ProductForm
            },

            // ORDERS
            {
                path: 'orders',
                component: Orders
            },

            // CUSTOMERS
            {
                path: 'customers',
                component: Customers
            },

            // CATEGORIES
            {
                path: 'categories',
                component: Categories
            },

            // SETTINGS
            {
                path: 'settings',
                component: Settings
            },
            {
                path: 'coupons',
                loadComponent: () =>
                    import('./admin/coupons/coupons')
                        .then(m => m.CouponsComponent)
            },
        ]
    },

    // DEFAULT ROUTE
    {
        path: '',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full'
    },

    // UNKNOWN ROUTES
    {
        path: '**',
        redirectTo: 'admin/dashboard'
    }
];
