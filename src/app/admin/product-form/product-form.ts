
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth';

interface Product {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  purchaseCost: number;
  packagingCost: number;
  marginPercentage: number;
  imageUrl: string;
  imageUrls?: string[];
  stock: number;
  sku: string;
  active: boolean;

  salesChannel?: 'ONLINE' | 'STORE_PICKUP';
}

interface ProductImage {
  url: string;
  file?: File;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit, OnDestroy {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  private apiUrl = 'https://e-commerce-backend-kyir.onrender.com/api/products';
  private baseUrl = 'https://e-commerce-backend-kyir.onrender.com';

  isEditMode = false;
  productId: number | null = null;

  loading = false;
  saving = false;
  uploadingImages = false;

  errorMessage = '';
  successMessage = '';
  sessionExpired = false;
  private cdr = inject(ChangeDetectorRef);
  images: ProductImage[] = [];

  private readonly maxFileSize = 10 * 1024 * 1024;
  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  salesChannel: 'ONLINE' | 'STORE_PICKUP' = 'ONLINE';

  product: Product = this.emptyProduct();

  // Live selling price preview.
  // Final price is also calculated and saved by the backend.
  get calculatedSellingPrice(): number {
    const purchaseCost = Number(this.product.purchaseCost) || 0;
    const packagingCost = Number(this.product.packagingCost) || 0;
    const marginPercentage = Number(this.product.marginPercentage) || 0;

    const margin = purchaseCost * marginPercentage / 100;
    const basePrice = purchaseCost + packagingCost + margin;

    const paymentFee = basePrice * 0.03;
    const gst = paymentFee * 0.18;

    return Math.round(basePrice + paymentFee + gst);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const type = this.route.snapshot.queryParamMap.get('type');

    if (type === 'STORE_PICKUP') {
      this.salesChannel = 'STORE_PICKUP';
    } else {
      this.salesChannel = 'ONLINE';
    }

    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct(this.productId);
    }
  }

  ngOnDestroy(): void {
    this.images.forEach(image => {
      if (image.file) {
        URL.revokeObjectURL(image.url);
      }
    });
  }

  emptyProduct(): Product {
    return {
      name: '',
      category: '',
      description: '',
      price: 0,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      purchaseCost: 0,
      packagingCost: 0,
      marginPercentage: 5,
      imageUrl: '',
      imageUrls: [],
      stock: 0,
      sku: '',
      active: true
    };
  }


  loadProduct(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.sessionExpired = false;

    const token = localStorage.getItem('authToken');

    console.log('EDIT PRODUCT ID:', id);
    console.log('EDIT PRODUCT API:', `${this.apiUrl}/${id}`);
    console.log('TOKEN EXISTS:', !!token);

    if (!token || !this.authService.hasValidAdminSession()) {
      this.loading = false;
      this.sessionExpired = true;
      this.errorMessage =
        'Your admin session has expired. Sign in again, then reload this product.';
      return;
    }

    this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (response) => {
        console.log('EDIT PRODUCT RAW RESPONSE:', response);

        // Support a direct product response or common response wrappers.
        const data = response?.data ?? response?.product ?? response;

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          this.errorMessage = 'Invalid product data received from the server.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        console.log('EDIT PRODUCT DATA:', data);

        this.product = {
          ...this.emptyProduct(),
          ...data
        };

        this.salesChannel = data.salesChannel ?? 'ONLINE';

        const savedUrls = Array.isArray(data.imageUrls) && data.imageUrls.length
          ? data.imageUrls
          : (data.imageUrl ? [data.imageUrl] : []);

        this.images = savedUrls.map((url: string) => ({
          url,
          file: undefined
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('EDIT PRODUCT LOAD ERROR:', error);
        this.loading = false;
        this.cdr.detectChanges();

        if (error.status === 401 || error.status === 403) {
          this.sessionExpired = true;
          this.errorMessage =
            'Your session may have expired or you do not have permission to edit this product.';
        } else {
          this.errorMessage =
            `Unable to load product details. HTTP Status: ${error.status}`;
        }
      }
    });
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.errorMessage = '';
    this.successMessage = '';

    for (const file of files) {
      if (!this.allowedTypes.includes(file.type)) {
        this.errorMessage =
          `${file.name}: Only JPG, PNG, WEBP and GIF images are allowed.`;
        continue;
      }

      if (file.size > this.maxFileSize) {
        this.errorMessage =
          `${file.name}: Image size must be 10 MB or smaller.`;
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      this.images.push({
        file,
        url: previewUrl
      });
    }

    input.value = '';
  }

  removeImage(index: number): void {
    const image = this.images[index];

    if (image?.file) {
      URL.revokeObjectURL(image.url);
    }

    this.images.splice(index, 1);
  }

  getPreviewUrl(url: string): string {
    if (
      url.startsWith('blob:') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    return `${this.baseUrl}${url}`;
  }

  private async uploadPendingImages(token: string): Promise<void> {
    const pendingImages = this.images.filter(image => image.file);

    if (pendingImages.length === 0) {
      return;
    }

    this.uploadingImages = true;

    const formData = new FormData();

    pendingImages.forEach(image => {
      formData.append('files', image.file as File);
    });

    try {
      console.log('========== IMAGE UPLOAD START ==========');
      console.log('Selected images:', pendingImages.length);

      const uploadResponse = await firstValueFrom(
        this.http.post<string[]>(
          `${this.apiUrl}/images/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            observe: 'response'
          }
        )
      );

      console.log('UPLOAD STATUS:', uploadResponse.status);
      console.log('UPLOAD BODY:', uploadResponse.body);
      console.log('UPLOAD HEADERS:', uploadResponse.headers);

      const uploadedUrls = uploadResponse.body;

      if (
        !Array.isArray(uploadedUrls) ||
        uploadedUrls.length !== pendingImages.length
      ) {
        throw new Error(
          `Invalid upload response. Expected ${pendingImages.length} URLs, received ${uploadedUrls?.length ?? 0}.`
        );
      }

      let uploadedIndex = 0;

      this.images = this.images.map(image => {
        if (!image.file) {
          return image;
        }

        URL.revokeObjectURL(image.url);

        const uploadedImage: ProductImage = {
          url: uploadedUrls[uploadedIndex]
        };

        uploadedIndex++;

        return uploadedImage;
      });

      console.log('UPLOADED IMAGE URLS:', uploadedUrls);
      console.log('========== IMAGE UPLOAD SUCCESS ==========');

    } catch (error: any) {
      console.error('========== IMAGE UPLOAD ERROR ==========');
      console.error('Status Code:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('Message:', error.message);
      console.error('Request URL:', error.url);
      console.error('Error Body:', error.error);
      console.error('Full Error:', error);
      console.error('==========================================');

      throw error;

    } finally {
      this.uploadingImages = false;
    }
  }

  async saveProduct(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.sessionExpired = false;

    if (
      !this.product.name.trim() ||
      !this.product.category.trim() ||
      !this.product.sku.trim()
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const purchaseCost = Number(this.product.purchaseCost);
    const packagingCost = Number(this.product.packagingCost);
    const marginPercentage = Number(this.product.marginPercentage);
    const stock = Number(this.product.stock);
    const weight = Number(this.product.weight);
    const length = Number(this.product.length);
    const width = Number(this.product.width);
    const height = Number(this.product.height);

    if (
      !Number.isFinite(purchaseCost) ||
      !Number.isFinite(packagingCost) ||
      !Number.isFinite(marginPercentage) ||
      purchaseCost < 0 ||
      packagingCost < 0 ||
      marginPercentage < 0
    ) {
      this.errorMessage =
        'Purchase cost, packaging cost and margin must be valid non-negative numbers.';
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      this.errorMessage =
        'Available stock must be a non-negative whole number.';
      return;
    }

    if (this.salesChannel === 'ONLINE') {

      if (
        !Number.isFinite(weight) || weight <= 0 ||
        !Number.isFinite(length) || length <= 0.5 ||
        !Number.isFinite(width) || width <= 0.5 ||
        !Number.isFinite(height) || height <= 0.5
      ) {
        this.errorMessage =
          'Enter a weight greater than 0 kg and package dimensions greater than 0.5 cm.';
        return;
      }

    }

    this.saving = true;

    const token = localStorage.getItem('authToken');

    if (!token || !this.authService.hasValidAdminSession()) {
      this.saving = false;
      this.sessionExpired = true;
      this.errorMessage = 'Your admin session has expired. Sign in again in a new tab, then retry saving this product.';
      return;
    }

    try {
      // Upload newly selected images first
      await this.uploadPendingImages(token);

      const imageUrls = this.images.map(image => image.url);

      const request = {
        name: this.product.name.trim(),
        category: this.product.category.trim(),
        description: this.product.description.trim(),

        purchaseCost,
        packagingCost,
        marginPercentage,

        salesChannel: this.salesChannel,

        weight,
        length,
        width,
        height,

        imageUrl: imageUrls[0] ?? '',
        imageUrls,

        stock,
        sku: this.product.sku.trim(),
        active: this.product.active
      };

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const response = this.isEditMode && this.productId !== null
        ? await firstValueFrom(
          this.http.put(
            `${this.apiUrl}/${this.productId}`,
            request,
            { headers }
          )
        )
        : await firstValueFrom(
          this.http.post(
            this.apiUrl,
            request,
            { headers }
          )
        );

      console.log('Product saved successfully:', response);

      this.successMessage = this.isEditMode
        ? 'Product updated successfully.'
        : 'Product added successfully.';

      this.router.navigate(['/admin/products']);

    } catch (error: any) {
      console.error('========== SAVE PRODUCT ERROR ==========');
      console.error('Status Code:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('Message:', error.message);
      console.error('Request URL:', error.url);
      console.error('Error Body:', error.error);
      console.error('Full Error:', error);
      console.error('=========================================');

      if (error.status === 401) {
        this.sessionExpired = true;
        this.errorMessage = 'Your admin session expired while saving. Sign in again in a new tab, then retry saving this product.';
      } else {
        this.errorMessage =
          error.error?.message ||
          error.message ||
          'Unable to save product. Please try again.';
      }

    } finally {
      this.saving = false;
      this.uploadingImages = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }

  get loginUrl(): string {
    return `/admin/login?returnUrl=${encodeURIComponent(this.router.url)}`;
  }
}
