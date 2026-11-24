import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Items } from './pages/items/items';
import { ItemForm } from './pages/item-form/item-form';
import { Users } from './pages/users/users';
import { Stock } from './pages/stock/stock';
import { StockBatchForm } from './pages/stock-batch-form/stock-batch-form';

// Supplier components
import { Suppliers } from './pages/suppliers/suppliers';
import { SupplierForm } from './pages/supplier-form/supplier-form';

// Stock components
import { StockTransactions } from './pages/stock-transactions/stock-transactions';
import { ManageStock } from './pages/manage-stock/manage-stock';

// Purchase Order components
import { PurchaseOrders } from './pages/purchase-orders/purchase-orders';
import { PurchaseOrderForm } from './pages/purchase-order-form/purchase-order-form';

// Goods Received components
import { GoodsReceivedPage } from './pages/goods-received/goods-received';
import { GoodsReceivedForm } from './pages/goods-received-form/goods-received-form';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },

  // Add and Edit Item pages
  { path: 'items/new', component: ItemForm },
  { path: 'items/edit/:id', component: ItemForm },

  // Inventory Items list
  { path: 'items', component: Items },

  // Add and Edit Supplier pages
  { path: 'suppliers/new', component: SupplierForm },
  { path: 'suppliers/edit/:id', component: SupplierForm },

  // Supplier list
  { path: 'suppliers', component: Suppliers },

  // Add and Edit Purchase Order pages
  { path: 'purchase-orders/new', component: PurchaseOrderForm },
  { path: 'purchase-orders/edit/:id', component: PurchaseOrderForm },

  // Purchase Orders list
  { path: 'purchase-orders', component: PurchaseOrders },

  // Create Goods Received Note
  { path: 'goods-received/new', component: GoodsReceivedForm },

  // Goods Received list
  { path: 'goods-received', component: GoodsReceivedPage },
  // Reports page
  { path: 'reports', component: Reports },

  // Stock pages
  { path: 'stock/batches/:id/transactions', component: StockTransactions },
  { path: 'stock/batches/:id/manage', component: ManageStock },
  { path: 'stock/batches/new', component: StockBatchForm },
  { path: 'stock', component: Stock },

  { path: 'users', component: Users },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
