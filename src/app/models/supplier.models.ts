
// Represents a supplier returned by the backend API.
export interface Supplier {
  supplierId: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string | null;
  city: string | null;
  country: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// Represents the information required to create or update a supplier.
export interface SupplierRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string | null;
  city: string | null;
  country: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
}
