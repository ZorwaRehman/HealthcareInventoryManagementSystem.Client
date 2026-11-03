
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Items } from './pages/items/items';
import { ItemForm } from './pages/item-form/item-form';
import { Users } from './pages/users/users';
import { Stock } from './pages/stock/stock';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },

  // Add and Edit Item pages
  { path: 'items/new', component: ItemForm },
  { path: 'items/edit/:id', component: ItemForm },

  // Inventory Items list
  { path: 'items', component: Items },

  { path: 'users', component: Users },
  { path: 'stock', component: Stock },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
