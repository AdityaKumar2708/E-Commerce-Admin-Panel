
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Product {
  id: number;
  name?: string;
  category?: string;
  active?: boolean;
}

interface Category {
  name: string;
  description: string;
  productCount: number;
  activeProductCount: number;
  active: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories implements OnInit {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://10.96.110.94:8080/api/products';

  searchText = '';
  categories: Category[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  get filteredCategories(): Category[] {
    const search = this.searchText.trim().toLowerCase();

    return this.categories.filter(category =>
      category.name.toLowerCase().includes(search) ||
      category.description.toLowerCase().includes(search)
    );
  }

  get totalProducts(): number {
    return this.categories.reduce(
      (total, category) => total + category.productCount,
      0
    );
  }

  get activeCategories(): number {
    return this.categories.filter(category => category.active).length;
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: response => {
        console.log('Categories - Products API response:', response);

        const products: Product[] = Array.isArray(response) ? response : [];
        const categoryMap = new Map<string, Category>();

        for (const product of products) {
          const name = product.category?.trim();

          if (!name) {
            continue;
          }

          const key = name.toLowerCase();
          const existing = categoryMap.get(key);

          if (existing) {
            existing.productCount++;

            if (product.active === true) {
              existing.activeProductCount++;
            }
          } else {
            categoryMap.set(key, {
              name,
              description: '',
              productCount: 1,
              activeProductCount: product.active === true ? 1 : 0,
              active: product.active === true
            });
          }
        }

        this.categories = Array.from(categoryMap.values())
          .map(category => ({
            ...category,
            description: `${category.productCount} product${category.productCount === 1 ? '' : 's'
              } in this category`,
            active: category.activeProductCount > 0
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        this.loading = false;
      },
      error: error => {
        console.error('Categories API error:', error);
        this.categories = [];
        this.loading = false;
        this.errorMessage =
          'Categories could not be loaded. Check the backend connection.';
      }
    });
  }
}
