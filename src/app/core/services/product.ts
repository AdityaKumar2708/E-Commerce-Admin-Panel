
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
    id: number;
    name: string;
    category: string;
    description: string;
    price: number;
    imageUrl: string;
    imageUrls?: string[];
    stock: number;
    sku: string;
    originalPrice: number;
    active: boolean;

    salesChannel?: 'ONLINE' | 'STORE_PICKUP';
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private http = inject(HttpClient);

    private baseUrl = 'http://10.96.110.94:8080';
    private apiUrl = `${this.baseUrl}/api/products`;

    private authOptions() {
        const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('authToken');
        return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
    }

    // Get All Products
    getAllProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl);
    }

    // Get Product By ID
    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    // Upload Multiple Product Images
    uploadImages(files: File[]): Observable<string[]> {
        const formData = new FormData();

        files.forEach(file => {
            formData.append('files', file);
        });

        return this.http.post<string[]>(
            `${this.apiUrl}/images/upload`,
            formData
        );
    }

    // Convert backend image path to full URL for display
    getImageSrc(imageUrl: string | null | undefined): string {
        if (!imageUrl) {
            return 'assets/images/no-image.png';
        }

        if (imageUrl.startsWith('http://') ||
            imageUrl.startsWith('https://')) {
            return imageUrl;
        }

        return `${this.baseUrl}${imageUrl}`;
    }

    // Add Product
    addProduct(product: Partial<Product>): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product, this.authOptions());
    }

    // Update Product
    updateProduct(
        id: number,
        product: Partial<Product>
    ): Observable<Product> {
        return this.http.put<Product>(
            `${this.apiUrl}/${id}`,
            product,
            this.authOptions()
        );
    }

    // Delete Product
    deleteProduct(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.authOptions());
    }
}
