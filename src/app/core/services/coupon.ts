import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Coupon {
    id?: number;

    code: string;

    type: 'PERCENTAGE' | 'FIXED';

    discountValue: number;

    minimumOrderValue?: number | null;

    maximumDiscount?: number | null;

    active: boolean;

    usageLimit?: number | null;

    usedCount?: number;

    perCustomerLimit?: number | null;

    startAt?: string | null;

    expiresAt?: string | null;

    createdAt?: string;

    updatedAt?: string;
}


// Backend URL
function apiBaseUrl(): string {
    return 'https://e-commerce-backend-kyir.onrender.com';
}


@Injectable({
    providedIn: 'root'
})
export class CouponService {

    private http = inject(HttpClient);

    private readonly API_URL =
        `${apiBaseUrl()}/api/admin/coupons`;


    // ==========================================
    // GET ALL COUPONS
    // ==========================================

    getAllCoupons(): Observable<Coupon[]> {
        return this.http.get<Coupon[]>(
            this.API_URL,
            this.authOptions()
        );
    }

    // ==========================================
    // GET COUPON BY ID
    // ==========================================

    private authOptions() {
        const token =
            typeof localStorage === 'undefined'
                ? null
                : localStorage.getItem('authToken');

        return token
            ? {
                headers: new HttpHeaders({
                    Authorization: `Bearer ${token}`
                })
            }
            : {};
    }
    getCouponById(id: number): Observable<Coupon> {
        return this.http.get<Coupon>(
            `${this.API_URL}/${id}`,
            this.authOptions()
        );
    }


    // ==========================================
    // CREATE COUPON
    // ==========================================

    createCoupon(coupon: Coupon): Observable<Coupon> {
        return this.http.post<Coupon>(
            this.API_URL,
            coupon,
            this.authOptions()
        );
    }


    // ==========================================
    // UPDATE COUPON
    // ==========================================

    updateCoupon(
        id: number,
        coupon: Coupon
    ): Observable<Coupon> {
        return this.http.put<Coupon>(
            `${this.API_URL}/${id}`,
            coupon,
            this.authOptions()
        );
    }


    // ==========================================
    // ACTIVATE / DEACTIVATE
    // ==========================================

    toggleCoupon(id: number): Observable<Coupon> {
        return this.http.patch<Coupon>(
            `${this.API_URL}/${id}/toggle`,
            {},
            this.authOptions()
        );
    }


    // ==========================================
    // DELETE COUPON
    // ==========================================

    deleteCoupon(id: number): Observable<void> {
        return this.http.delete<void>(
            `${this.API_URL}/${id}`,
            this.authOptions()
        );
    }
}