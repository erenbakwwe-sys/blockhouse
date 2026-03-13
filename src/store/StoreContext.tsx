import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Order, WaiterCall, Table, MenuItem, Expense, GlobalSettings, OrderItem } from '../types';
import { initialMenu, initialTables } from '../data/menu';

export const socket = io();

interface StoreState {
  orders: Order[];
  calls: WaiterCall[];
  tables: Table[];
  menu: MenuItem[];
  expenses: Expense[];
  settings: GlobalSettings;
  cart: OrderItem[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  addCall: (table: string) => void;
  resolveCall: (callId: string) => void;
  addToCart: (item: Omit<OrderItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  clearHistory: () => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ estimatedPrepTime: 15 });
  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to local storage
  useEffect(() => { localStorage.setItem('cart_v2', JSON.stringify(cart)); }, [cart]);

  // Sync state from WebSocket server
  useEffect(() => {
    socket.on('initialState', (state) => {
      setOrders(state.orders || []);
      setCalls(state.calls || []);
      setMenu(state.menu || []);
      setTables(state.tables || []);
      setExpenses(state.expenses || []);
      if (state.settings) setSettings(state.settings);
    });

    socket.on('stateUpdate', (state) => {
      setOrders(state.orders || []);
      setCalls(state.calls || []);
      setMenu(state.menu || []);
      setTables(state.tables || []);
      setExpenses(state.expenses || []);
      if (state.settings) setSettings(state.settings);
    });

    return () => {
      socket.off('initialState');
      socket.off('stateUpdate');
    };
  }, []);

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    socket.emit('addOrder', newOrder);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    socket.emit('updateOrderStatus', { orderId, status });
  };

  const addCall = (table: string) => {
    const newCall: WaiterCall = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      status: 'active',
      createdAt: Date.now(),
    };
    socket.emit('addCall', newCall);
  };

  const resolveCall = (callId: string) => {
    socket.emit('resolveCall', callId);
  };

  const addToCart = (itemData: Omit<OrderItem, 'id'>) => {
    setCart((prev) => {
      // Check if identical item exists (same menu item, notes, options)
      const existingIndex = prev.findIndex(i => 
        i.menuItemId === itemData.menuItemId && 
        i.notes === itemData.notes && 
        JSON.stringify(i.options) === JSON.stringify(itemData.options)
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += itemData.quantity;
        return newCart;
      }

      return [...prev, { ...itemData, id: Math.random().toString(36).substring(2, 9) }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(i => i.id === cartItemId);
      if (existingIndex >= 0) {
        const newCart = [...prev];
        if (newCart[existingIndex].quantity > 1) {
          newCart[existingIndex].quantity -= 1;
        } else {
          newCart.splice(existingIndex, 1);
        }
        return newCart;
      }
      return prev;
    });
  };

  const clearCart = () => setCart([]);

  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...itemData, id: Math.random().toString(36).substring(2, 9) };
    socket.emit('addMenuItem', newItem);
  };

  const updateMenuItem = (id: string, itemData: Partial<MenuItem>) => {
    socket.emit('updateMenuItem', { id, item: itemData });
  };

  const deleteMenuItem = (id: string) => {
    socket.emit('deleteMenuItem', id);
  };

  const clearHistory = () => {
    socket.emit('clearHistory');
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    socket.emit('addExpense', newExpense);
  };

  const deleteExpense = (id: string) => {
    socket.emit('deleteExpense', id);
  };

  const updateSettings = (newSettings: Partial<GlobalSettings>) => {
    socket.emit('updateSettings', newSettings);
  };

  return (
    <StoreContext.Provider value={{ 
      orders, calls, tables, menu, expenses, settings, cart, 
      addOrder, updateOrderStatus, addCall, resolveCall, 
      addToCart, removeFromCart, clearCart, 
      addMenuItem, updateMenuItem, deleteMenuItem, clearHistory,
      addExpense, deleteExpense, updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
