import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
    Product,
    ProductService
} from '../../core/services/product';

import { AuthService } from '../../core/services/auth';

type SalesChannel = 'ONLINE' | 'STORE_PICKUP';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-list.html',
    styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {

    private productService = inject(ProductService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    products: Product[] = [];
    filteredProducts: Product[] = [];

    searchText = '';
    selectedCategory = 'All';

    salesChannel?: 'ONLINE' | 'STORE_PICKUP';

    // ONLINE / STORE PICKUP / ALL
    selectedSalesChannel: 'ALL' | SalesChannel = 'ALL';


    loading = false;
    errorMessage = '';
    successMessage = '';

    deletingId: number | null = null;

    ngOnInit(): void {
        console.log('ProductList component loaded');

        this.loadProducts();
    }

    // =========================================================
    // SUMMARY COUNTS
    // =========================================================

    get activeProductsCount(): number {
        return this.products.filter(product => product.active).length;
    }

    get outOfStockCount(): number {
        return this.products.filter(
            product => Number(product.stock) <= 0
        ).length;
    }

    get onlineProductsCount(): number {
        return this.products.filter(
            product => product.salesChannel === 'ONLINE'
        ).length;
    }

    get pickupProductsCount(): number {
        return this.products.filter(
            product => product.salesChannel === 'STORE_PICKUP'
        ).length;
    }

    // =========================================================
    // UNIQUE CATEGORIES
    // =========================================================

    get categories(): string[] {

        const uniqueCategories = [
            ...new Set(
                this.products
                    .map(product => product.category)
                    .filter(
                        (category): category is string =>
                            typeof category === 'string' &&
                            category.trim().length > 0
                    )
            )
        ];

        return ['All', ...uniqueCategories];
    }

    // =========================================================
    // LOAD PRODUCTS
    // =========================================================

    loadProducts(): void {

        this.loading = true;
        this.errorMessage = '';

        console.log('Loading products API...');

        this.productService.getAllProducts().subscribe({
            next: (response: any) => {
                console.log('PRODUCT API RESPONSE:', response);

                const data = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.content)
                        ? response.content
                        : Array.isArray(response?.data)
                            ? response.data
                            : Array.isArray(response?.products)
                                ? response.products
                                : [];

                this.products = data.filter(
                    (product: Product) => product.active !== false
                );
                this.applyFilters();
                this.loading = false;

                console.log('TOTAL PRODUCTS:', this.products.length);
                console.log('FILTERED PRODUCTS:', this.filteredProducts.length);

                this.cdr.detectChanges();
            },

            error: (error: HttpErrorResponse) => {
                console.error('PRODUCT API ERROR:', error);

                this.loading = false;
                this.errorMessage = error.status === 401
                    ? 'Your admin session expired. Please sign in again.'
                    : `Unable to load products. HTTP Status: ${error.status}`;

                if (error.status === 401) {
                    this.authService.clearSession();

                    this.router.navigate(['/admin/login'], {
                        queryParams: {
                            returnUrl: '/admin/products'
                        }
                    });
                }

                this.cdr.detectChanges();
            }
        });
    }

    // =========================================================
    // SEARCH + CATEGORY + SALES CHANNEL FILTER
    // =========================================================

    applyFilters(): void {
        const search = this.searchText.trim().toLowerCase();

        this.filteredProducts = this.products.filter(product => {

            const name = (product.name ?? '').toLowerCase();
            const sku = (product.sku ?? '').toLowerCase();
            const category = (product.category ?? '').toLowerCase();

            const matchesSearch =
                name.includes(search) ||
                sku.includes(search) ||
                category.includes(search);

            const matchesCategory =
                this.selectedCategory === 'All' ||
                product.category === this.selectedCategory;

            const matchesSalesChannel =
                this.selectedSalesChannel === 'ALL' ||
                product.salesChannel === this.selectedSalesChannel;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesSalesChannel
            );
        });
    }


    // =========================================================
    // SALES CHANNEL FILTER
    // =========================================================

    selectSalesChannel(
        channel: 'ALL' | 'ONLINE' | 'STORE_PICKUP'
    ): void {
        this.selectedSalesChannel = channel;
        this.applyFilters();
    }

    // =========================================================
    // ADD ONLINE PRODUCT
    // =========================================================

    addOnlineProduct(): void {

        this.router.navigate(
            ['/admin/products/add'],
            {
                queryParams: {
                    type: 'ONLINE'
                }
            }
        );
    }

    // =========================================================
    // ADD STORE PICKUP PRODUCT
    // =========================================================

    addStorePickupProduct(): void {

        this.router.navigate(
            ['/admin/products/add'],
            {
                queryParams: {
                    type: 'STORE_PICKUP'
                }
            }
        );
    }

    // =========================================================
    // EDIT PRODUCT
    // =========================================================

    editProduct(id: number): void {

        this.router.navigate(
            ['/admin/products/edit', id]
        );
    }

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    deleteProduct(product: Product): void {

        if (
            this.deletingId !== null ||
            product.id == null
        ) {
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) {
            return;
        }

        const id = product.id;

        this.deletingId = id;

        this.errorMessage = '';
        this.successMessage = '';

        this.productService.deleteProduct(id)
            .subscribe({

                next: () => {

                    this.products =
                        this.products.filter(
                            item => item.id !== id
                        );

                    this.applyFilters();

                    this.deletingId = null;

                    this.successMessage =
                        'Product deleted successfully.';
                },

                error: (error) => {

                    console.error(
                        'Delete product error:',
                        error
                    );

                    this.deletingId = null;

                    this.errorMessage =
                        'Unable to delete product. Please try again.';
                }
            });
    }

    // =========================================================
    // CLEAR FILTERS
    // =========================================================
    clearFilters(): void {
        this.searchText = '';
        this.selectedCategory = 'All';
        this.selectedSalesChannel = 'ALL';

        this.applyFilters();
    }

    // =========================================================
    // DASHBOARD
    // =========================================================

    goToDashboard(): void {

        this.router.navigate(
            ['/admin/dashboard']
        );
    }

    // =========================================================
    // IMAGE URL VALIDATION
    // =========================================================

    isValidImageUrl(
        url: string | null | undefined
    ): boolean {

        if (!url) {
            return false;
        }

        try {

            const parsedUrl =
                new URL(url);

            return (
                parsedUrl.protocol === 'http:' ||
                parsedUrl.protocol === 'https:'
            );

        } catch {

            return false;
        }
    }
}