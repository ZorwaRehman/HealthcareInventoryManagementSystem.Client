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
import { StockTransactions } from './pages/stock-transactions/stock-transactions';
import { ManageStock } from './pages/manage-stock/manage-stock';

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

  { path: 'users', component: Users },
  {
    path: 'stock/batches/:id/transactions',
    component: StockTransactions,
  },
  {
    path: 'stock/batches/:id/manage',
    component: ManageStock,
  },
  { path: 'stock/batches/new', component: StockBatchForm },
  { path: 'stock', component: Stock },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
