
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

interface OrderItem {
  productId?: number;
  productName?: string;
  quantity?: number;
  totalPrice?: number;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt?: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentType?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders implements OnInit {

  private readonly apiUrl =
    'https://e-commerce-backend-kyir.onrender.com/api/admin/orders';

  orders: AdminOrder[] = [];

  searchText = '';
  selectedStatus = 'ALL';

  loading = false;
  acceptingOrderId: number | null = null;
  processingOrderId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOrders();
    }
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.orders.filter(
      order => order.orderStatus === 'PENDING'
    ).length;
  }

  get confirmedOrders(): number {
    return this.orders.filter(
      order => order.orderStatus === 'CONFIRMED'
    ).length;
  }


  get packedOrders(): number {
    return this.orders.filter(
      order => order.orderStatus === 'PACKED'
    ).length;
  }


  get cancelledOrders(): number {
    return this.orders.filter(
      order => order.orderStatus === 'CANCELLED'
    ).length;
  }



  get filteredOrders(): AdminOrder[] {
    const search = (this.searchText || '').trim().toLowerCase();
    const status = (this.selectedStatus || 'ALL').toUpperCase();

    return (this.orders || []).filter((order: AdminOrder) => {
      const matchesSearch =
        (order.orderNumber || '').toLowerCase().includes(search) ||
        (order.customerName || '').toLowerCase().includes(search) ||
        (order.customerEmail || '').toLowerCase().includes(search);

      const orderStatus = (order.orderStatus || 'PENDING').toUpperCase();

      const matchesStatus =
        status === 'ALL' || orderStatus === status;

      return matchesSearch && matchesStatus;
    });
  }

  loadOrders(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      this.errorMessage =
        'Admin login required. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response: any) => {
        console.log('API response:', response);

        const data = Array.isArray(response)
          ? response
          : response?.content ?? response?.data ?? [];

        this.orders = data.map((order: any) => ({
          ...order,
          orderStatus: String(order.orderStatus ?? 'PENDING').toUpperCase(),
          paymentStatus: String(order.paymentStatus ?? 'PENDING').toUpperCase(),
          items: order.items ?? [],
          totalAmount: Number(order.totalAmount ?? 0)
        }));

        this.loading = false;
        this.cdr.detectChanges();

      },
      error: (error) => {
        console.error('Admin orders API error:', error);

        this.errorMessage =
          error.status === 401 || error.status === 403
            ? 'Admin access denied. Please log in with an admin account.'
            : 'Unable to load orders. Check the backend and try again.';

        this.loading = false;
      }
    });
  }

  acceptOrder(order: AdminOrder): void {
    if (
      order.orderStatus !== 'PENDING' ||
      this.acceptingOrderId !== null
    ) {
      return;
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      this.errorMessage = 'Please log in again as admin.';
      return;
    }

    this.acceptingOrderId = order.id;
    this.errorMessage = '';
    this.successMessage = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.patch<AdminOrder>(
      `${this.apiUrl}/${order.id}/accept`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        order.orderStatus = String(
          response?.orderStatus ?? 'CONFIRMED'
        ).toUpperCase();

        this.successMessage =
          `Order ${order.orderNumber} accepted successfully.`;

        this.acceptingOrderId = null;
      },
      error: (error) => {
        console.error('Accept order API error:', error);

        this.errorMessage =
          error.error?.message ??
          'Unable to accept this order. Please try again.';

        this.acceptingOrderId = null;
      }
    });
  }

  refreshOrders(): void {
    this.successMessage = '';
    this.loadOrders();
  }

  getItemSummary(items: OrderItem[]): string {
    if (!items?.length) {
      return 'No items';
    }

    return items
      .map(item =>
        `${item.productName ?? 'Product'} × ${item.quantity ?? 1}`
      )
      .join(', ');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Accepted',
      PROCESSING: 'Processing',
      PACKED: 'Packed',
      SHIPPED: 'Shipped',
      OUT_FOR_DELIVERY: 'Out for delivery',
      DELIVERED: 'Delivered',
      READY_FOR_PICKUP: 'Ready for pickup',
      PICKED_UP: 'Picked up',
      CANCELLED: 'Cancelled'
    };

    return labels[status] ?? status;
  }


  // =====================================================
  // OFFLINE STORE PICKUP: MARK AS PACKED
  // =====================================================
  markAsPacked(order: AdminOrder): void {
    if (
      order.fulfillmentType !== 'STORE_PICKUP' ||
      order.orderStatus !== 'CONFIRMED' ||
      this.processingOrderId !== null
    ) {
      return;
    }

    this.updateStorePickupStatus(
      order,
      'packed',
      'PACKED',
      'Order marked as packed successfully.'
    );
  }

  // =====================================================
  // OFFLINE STORE PICKUP: MARK AS PICKED UP
  // =====================================================
  markAsPickedUp(order: AdminOrder): void {
    if (
      order.fulfillmentType !== 'STORE_PICKUP' ||
      order.orderStatus !== 'PACKED' ||
      this.processingOrderId !== null
    ) {
      return;
    }

    const confirmed = confirm(
      `Confirm that order ${order.orderNumber} has been picked up by the customer?`
    );

    if (!confirmed) {
      return;
    }

    this.updateStorePickupStatus(
      order,
      'picked-up',
      'PICKED_UP',
      'Order marked as picked up successfully.'
    );
  }

  // =====================================================
  // COMMON API CALL FOR OFFLINE STORE PICKUP
  // =====================================================
  private updateStorePickupStatus(
    order: AdminOrder,
    endpoint: 'packed' | 'picked-up',
    expectedStatus: string,
    successMessage: string
  ): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.errorMessage = 'Please log in again as admin.';
      return;
    }

    this.processingOrderId = order.id;
    this.errorMessage = '';
    this.successMessage = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.patch<AdminOrder>(
      `${this.apiUrl}/${order.id}/${endpoint}`,
      {},
      { headers }
    ).subscribe({
      next: (response) => {
        order.orderStatus = String(
          response?.orderStatus ?? expectedStatus
        ).toUpperCase();

        this.successMessage =
          `Order ${order.orderNumber}: ${successMessage}`;

        this.processingOrderId = null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(
          `Failed to update order to ${expectedStatus}:`,
          error
        );

        this.errorMessage =
          error.error?.message ??
          `Unable to update order ${order.orderNumber}. Please try again.`;

        this.processingOrderId = null;
        this.cdr.detectChanges();
      }
    });
  }

}
