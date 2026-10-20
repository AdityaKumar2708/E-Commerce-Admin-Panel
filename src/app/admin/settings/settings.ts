
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  emailNotifications: boolean;
  orderNotifications: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  private readonly storageKey = 'rajeshStationerySettings';

  storeName = 'Rajesh Stationery & Novelty';
  supportEmail = '';
  supportPhone = '';
  currency = 'INR';

  emailNotifications = true;
  orderNotifications = true;

  saving = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);

      if (!saved) {
        return;
      }

      const settings = JSON.parse(saved) as Partial<StoreSettings>;

      this.storeName = settings.storeName ?? this.storeName;
      this.supportEmail = settings.supportEmail ?? '';
      this.supportPhone = settings.supportPhone ?? '';
      this.currency = settings.currency ?? 'INR';
      this.emailNotifications =
        settings.emailNotifications ?? true;
      this.orderNotifications =
        settings.orderNotifications ?? true;
    } catch (error) {
      console.error('Unable to load store settings:', error);
      this.errorMessage = 'Saved settings could not be loaded.';
    }
  }

  saveSettings(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.storeName.trim()) {
      this.errorMessage = 'Please enter your store name.';
      return;
    }

    if (
      this.supportEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.supportEmail.trim())
    ) {
      this.errorMessage = 'Please enter a valid support email address.';
      return;
    }

    this.saving = true;

    const settings: StoreSettings = {
      storeName: this.storeName.trim(),
      supportEmail: this.supportEmail.trim(),
      supportPhone: this.supportPhone.trim(),
      currency: this.currency,
      emailNotifications: this.emailNotifications,
      orderNotifications: this.orderNotifications
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
      this.successMessage = 'Settings saved successfully on this browser.';
    } catch (error) {
      console.error('Unable to save store settings:', error);
      this.errorMessage =
        'Settings could not be saved. Check your browser storage.';
    } finally {
      this.saving = false;
    }
  }

  resetSettings(): void {
    this.storeName = 'Rajesh Stationery & Novelty';
    this.supportEmail = '';
    this.supportPhone = '';
    this.currency = 'INR';
    this.emailNotifications = true;
    this.orderNotifications = true;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
