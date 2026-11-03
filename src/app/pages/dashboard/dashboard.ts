
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  totalItems = 248;
  lowStockItems = 12;
  totalUsers = 18;
  pendingOrders = 7;

  recentActivity = [
    {
      title: 'Surgical Gloves updated',
      detail: 'Inventory item quantity updated',
      time: '10 minutes ago',
      type: 'inventory',
    },
    {
      title: 'New supplier added',
      detail: 'MedCare Supplies',
      time: '35 minutes ago',
      type: 'supplier',
    },
    {
      title: 'Low stock alert',
      detail: 'Disposable Masks need restocking',
      time: '1 hour ago',
      type: 'alert',
    },
    {
      title: 'Purchase order created',
      detail: 'PO-2026-014',
      time: '2 hours ago',
      type: 'order',
    },
  ];

  logout(): void {
    // Demo only. Authentication is not connected yet.
    window.location.href = '/login';
  }
}
