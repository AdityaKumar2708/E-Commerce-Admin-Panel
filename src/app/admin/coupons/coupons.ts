import { CommonModule } from '@angular/common';
import {
    Component,
    OnInit,
    ChangeDetectorRef,
    inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
    Coupon,
    CouponService
} from '../../core/services/coupon';


@Component({
    selector: 'app-coupons',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './coupons.html',
    styleUrls: ['./coupons.scss']
})
export class CouponsComponent implements OnInit {
    coupons: Coupon[] = [];
    loading = false;
    saving = false;

    errorMessage = '';
    successMessage = '';

    showForm = false;
    editMode = false;

    editingCouponId: number | null = null;

    coupon: Coupon = this.getEmptyCoupon();


    private couponService = inject(CouponService);
    private cdr = inject(ChangeDetectorRef);

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    ngOnInit(): void {
        this.loadCoupons();
    }


    // ==========================================
    // EMPTY COUPON
    // ==========================================

    private getEmptyCoupon(): Coupon {

        return {
            code: '',
            type: 'PERCENTAGE',
            discountValue: 0,
            minimumOrderValue: null,
            maximumDiscount: null,
            active: true,
            usageLimit: null,
            usedCount: 0,
            perCustomerLimit: null,
            startAt: null,
            expiresAt: null
        };
    }


    // ==========================================
    // LOAD COUPONS
    // ==========================================



    loadCoupons(): void {
        this.loading = true;
        this.errorMessage = '';

        this.couponService.getAllCoupons().subscribe({
            next: (response) => {
                console.log('Coupons API response:', response);

                // Always assign a new array reference for Angular rendering.
                this.coupons = Array.isArray(response) ? [...response] : [];
                this.loading = false;

                this.cdr.detectChanges();

                console.log('Coupons count:', this.coupons.length);
                console.log(
                    'Rendered coupon rows:',
                    document.querySelectorAll('.coupon-list-card tbody tr').length
                );
            },
            error: (error: HttpErrorResponse) => {
                this.loading = false;

                console.error('Coupons API failed:', error);
                console.error('HTTP status:', error.status);
                console.error('Response body:', error.error);

                this.errorMessage =
                    error.status === 401 || error.status === 403
                        ? 'Please log in again to manage coupons.'
                        : `Unable to load coupons. HTTP ${error.status}`;

                this.cdr.detectChanges();
            }
        });
    }


    // ==========================================
    // OPEN CREATE FORM
    // ==========================================

    openCreateForm(): void {

        this.clearMessages();

        this.editMode = false;
        this.editingCouponId = null;

        this.coupon = this.getEmptyCoupon();

        this.showForm = true;
    }


    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    openEditForm(coupon: Coupon): void {

        this.clearMessages();

        this.editMode = true;

        this.editingCouponId =
            coupon.id ?? null;

        this.coupon = {
            ...coupon,

            minimumOrderValue:
                coupon.minimumOrderValue ?? null,

            maximumDiscount:
                coupon.maximumDiscount ?? null,

            usageLimit:
                coupon.usageLimit ?? null,

            perCustomerLimit:
                coupon.perCustomerLimit ?? null,

            startAt:
                this.formatDateTimeForInput(
                    coupon.startAt
                ),

            expiresAt:
                this.formatDateTimeForInput(
                    coupon.expiresAt
                )
        };

        this.showForm = true;
    }


    // ==========================================
    // CLOSE FORM
    // ==========================================

    closeForm(): void {

        if (this.saving) {
            return;
        }

        this.showForm = false;

        this.editMode = false;

        this.editingCouponId = null;

        this.coupon = this.getEmptyCoupon();

        this.clearMessages();
    }


    // ==========================================
    // SAVE COUPON
    // ==========================================

    saveCoupon(): void {

        this.clearMessages();

        if (!this.validateCoupon()) {
            return;
        }

        this.saving = true;

        const payload = this.preparePayload();


        // UPDATE
        if (this.editMode && this.editingCouponId) {

            this.couponService.updateCoupon(
                this.editingCouponId,
                payload
            ).subscribe({
                next: (response) => {

                    this.saving = false;

                    const index =
                        this.coupons.findIndex(
                            item =>
                                item.id === this.editingCouponId
                        );

                    if (index !== -1) {
                        this.coupons = this.coupons.map((item, i) =>
                            i === index ? response : item
                        );
                    }

                    this.cdr.detectChanges();

                    this.successMessage =
                        'Coupon updated successfully.';

                    this.closeForm();

                    this.successMessage =
                        'Coupon updated successfully.';
                },

                error: (error: HttpErrorResponse) => {

                    this.saving = false;

                    console.error(
                        'Update Coupon Error:',
                        error
                    );

                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'Unable to update coupon.'
                        );
                }
            });

            return;
        }


        // CREATE

        this.couponService.createCoupon(payload).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.coupon = this.getEmptyCoupon();
                this.successMessage = 'Coupon created successfully.';

                // Re-fetch persisted records from the backend after creating.
                this.loadCoupons();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.saving = false;
                console.error('Create coupon failed:', error);
                this.errorMessage = 'Unable to create coupon.';
            }
        });

    }


    // ==========================================
    // TOGGLE ACTIVE / INACTIVE
    // ==========================================

    toggleCoupon(coupon: Coupon): void {

        if (!coupon.id) {
            return;
        }

        this.clearMessages();

        this.couponService.toggleCoupon(
            coupon.id
        ).subscribe({

            next: (response) => {

                const index =
                    this.coupons.findIndex(
                        item =>
                            item.id === coupon.id
                    );

                if (index !== -1) {
                    this.coupons = this.coupons.map((item, i) =>
                        i === index ? response : item
                    );
                }

                this.cdr.detectChanges();

                this.successMessage =
                    response.active
                        ? 'Coupon activated.'
                        : 'Coupon deactivated.';
            },

            error: (error: HttpErrorResponse) => {

                console.error(
                    'Toggle Coupon Error:',
                    error
                );

                this.errorMessage =
                    this.getErrorMessage(
                        error,
                        'Unable to change coupon status.'
                    );
            }
        });
    }


    // ==========================================
    // DELETE COUPON
    // ==========================================

    deleteCoupon(coupon: Coupon): void {

        if (!coupon.id) {
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete coupon "${coupon.code}"?`
            );

        if (!confirmed) {
            return;
        }

        this.clearMessages();

        this.couponService.deleteCoupon(
            coupon.id
        ).subscribe({

            next: () => {

                this.coupons = this.coupons.filter(
                    item => item.id !== coupon.id
                );

                this.cdr.detectChanges();

                this.successMessage =
                    'Coupon deleted successfully.';
            },

            error: (error: HttpErrorResponse) => {

                console.error(
                    'Delete Coupon Error:',
                    error
                );

                this.errorMessage =
                    this.getErrorMessage(
                        error,
                        'Unable to delete coupon.'
                    );
            }
        });
    }


    // ==========================================
    // VALIDATION
    // ==========================================

    private validateCoupon(): boolean {

        const code =
            this.coupon.code?.trim();

        if (!code) {

            this.errorMessage =
                'Coupon code is required.';

            return false;
        }

        if (!/^[A-Za-z0-9_-]+$/.test(code)) {

            this.errorMessage =
                'Coupon code can contain only letters, numbers, hyphen and underscore.';

            return false;
        }

        if (!this.coupon.type) {

            this.errorMessage =
                'Please select a discount type.';

            return false;
        }

        if (
            this.coupon.discountValue == null ||
            Number(this.coupon.discountValue) <= 0
        ) {

            this.errorMessage =
                'Discount value must be greater than zero.';

            return false;
        }

        if (
            this.coupon.type === 'PERCENTAGE' &&
            Number(this.coupon.discountValue) > 100
        ) {

            this.errorMessage =
                'Percentage discount cannot be more than 100%.';

            return false;
        }

        if (
            this.coupon.minimumOrderValue != null &&
            Number(this.coupon.minimumOrderValue) < 0
        ) {

            this.errorMessage =
                'Minimum order value cannot be negative.';

            return false;
        }

        if (
            this.coupon.maximumDiscount != null &&
            Number(this.coupon.maximumDiscount) <= 0
        ) {

            this.errorMessage =
                'Maximum discount must be greater than zero.';

            return false;
        }

        if (
            this.coupon.usageLimit != null &&
            Number(this.coupon.usageLimit) <= 0
        ) {

            this.errorMessage =
                'Usage limit must be greater than zero.';

            return false;
        }

        if (
            this.coupon.perCustomerLimit != null &&
            Number(this.coupon.perCustomerLimit) <= 0
        ) {

            this.errorMessage =
                'Per customer limit must be greater than zero.';

            return false;
        }

        if (
            this.coupon.startAt &&
            this.coupon.expiresAt
        ) {

            const start =
                new Date(this.coupon.startAt);

            const expiry =
                new Date(this.coupon.expiresAt);

            if (expiry <= start) {

                this.errorMessage =
                    'Expiry date must be after start date.';

                return false;
            }
        }

        return true;
    }


    // ==========================================
    // PREPARE BACKEND PAYLOAD
    // ==========================================

    private preparePayload(): Coupon {

        return {

            ...this.coupon,

            code:
                this.coupon.code
                    .trim()
                    .toUpperCase(),

            discountValue:
                Number(this.coupon.discountValue),

            minimumOrderValue:
                this.toNumberOrNull(
                    this.coupon.minimumOrderValue
                ),

            maximumDiscount:
                this.toNumberOrNull(
                    this.coupon.maximumDiscount
                ),

            usageLimit:
                this.toIntegerOrNull(
                    this.coupon.usageLimit
                ),

            perCustomerLimit:
                this.toIntegerOrNull(
                    this.coupon.perCustomerLimit
                ),

            startAt:
                this.prepareDateTime(
                    this.coupon.startAt
                ),

            expiresAt:
                this.prepareDateTime(
                    this.coupon.expiresAt
                )
        };
    }


    // ==========================================
    // NUMBER HELPERS
    // ==========================================

    private toNumberOrNull(
        value: number | null | undefined
    ): number | null {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const numberValue = Number(value);

        return Number.isFinite(numberValue)
            ? numberValue
            : null;
    }


    private toIntegerOrNull(
        value: number | null | undefined
    ): number | null {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const numberValue = Number(value);

        return Number.isFinite(numberValue)
            ? Math.floor(numberValue)
            : null;
    }


    // ==========================================
    // DATE HELPERS
    // ==========================================

    private prepareDateTime(
        value: string | null | undefined
    ): string | null {

        if (!value) {
            return null;
        }

        /*
         * datetime-local normally returns:
         *
         * 2026-10-07T18:30
         *
         * Spring LocalDateTime accepts:
         *
         * 2026-10-07T18:30:00
         */

        return value.length === 16
            ? `${value}:00`
            : value;
    }


    private formatDateTimeForInput(
        value: string | null | undefined
    ): string | null {

        if (!value) {
            return null;
        }

        return value.length >= 16
            ? value.substring(0, 16)
            : value;
    }


    // ==========================================
    // DISPLAY HELPERS
    // ==========================================

    getDiscountText(
        coupon: Coupon
    ): string {

        if (coupon.type === 'PERCENTAGE') {

            return `${coupon.discountValue}%`;
        }

        return `₹${Number(
            coupon.discountValue
        ).toFixed(2)}`;
    }


    getUsageText(
        coupon: Coupon
    ): string {

        const used =
            coupon.usedCount ?? 0;

        if (coupon.usageLimit == null) {

            return `${used} / Unlimited`;
        }

        return `${used} / ${coupon.usageLimit}`;
    }


    isExpired(
        coupon: Coupon
    ): boolean {

        if (!coupon.expiresAt) {
            return false;
        }

        return new Date(
            coupon.expiresAt
        ) < new Date();
    }


    // ==========================================
    // MESSAGES
    // ==========================================

    private clearMessages(): void {

        this.errorMessage = '';
        this.successMessage = '';
    }


    private getErrorMessage(
        error: HttpErrorResponse,
        fallback: string
    ): string {

        if (
            error?.error?.message
        ) {
            return error.error.message;
        }

        if (
            typeof error?.error === 'string'
        ) {
            return error.error;
        }

        if (error?.status === 401) {
            return 'Your session has expired. Please login again.';
        }

        if (error?.status === 403) {
            return 'You do not have permission to manage coupons.';
        }

        return fallback;
    }
}