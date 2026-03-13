export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  options?: string[];
}

export interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}

export interface WaiterCall {
  id: string;
  table: string;
  status: 'active' | 'resolved';
  createdAt: number;
}

export interface Table {
  id: string;
  number: string;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: number;
}

export interface GlobalSettings {
  estimatedPrepTime: number; // in minutes
}
