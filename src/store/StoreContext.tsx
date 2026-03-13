import React, { createContext, useContext, useEffect, useState } from 'react';
import { Order, WaiterCall, Table, MenuItem, Expense, GlobalSettings, OrderItem } from '../types';
import { initialMenu, initialTables } from '../data/menu';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Sync cart to local storage
  useEffect(() => { localStorage.setItem('cart_v2', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync state from Firebase
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      if (snapshot.empty && user) {
        // Seed initial menu if empty and user is admin
        const batch = writeBatch(db);
        initialMenu.forEach(item => {
          batch.set(doc(collection(db, 'menu'), item.id), item);
        });
        batch.commit().catch(console.error);
      } else {
        setMenu(snapshot.docs.map(doc => doc.data() as MenuItem));
      }
    }, console.error);

    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      if (snapshot.empty && user) {
        // Seed initial tables if empty and user is admin
        const batch = writeBatch(db);
        initialTables.forEach(table => {
          batch.set(doc(collection(db, 'tables'), table.id), table);
        });
        batch.commit().catch(console.error);
      } else {
        setTables(snapshot.docs.map(doc => doc.data() as Table));
      }
    }, console.error);

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => doc.data() as Order));
    }, console.error);

    const unsubCalls = onSnapshot(query(collection(db, 'calls'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCalls(snapshot.docs.map(doc => doc.data() as WaiterCall));
    }, console.error);

    let unsubExpenses = () => {};
    if (user) {
      unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')), (snapshot) => {
        setExpenses(snapshot.docs.map(doc => doc.data() as Expense));
      }, console.error);
    }

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as GlobalSettings);
      } else if (user) {
        setDoc(doc(db, 'settings', 'global'), { estimatedPrepTime: 15 }).catch(console.error);
      }
    }, console.error);

    return () => {
      unsubMenu();
      unsubTables();
      unsubOrders();
      unsubCalls();
      unsubExpenses();
      unsubSettings();
    };
  }, [isAuthReady, user]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    if (!isAuthReady) return;
    const newOrder: Order = {
      ...orderData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(collection(db, 'orders'), newOrder.id), newOrder);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!isAuthReady) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const addCall = async (table: string) => {
    if (!isAuthReady) return;
    const newCall: WaiterCall = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      status: 'active',
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(collection(db, 'calls'), newCall.id), newCall);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveCall = async (callId: string) => {
    if (!isAuthReady) return;
    try {
      await updateDoc(doc(db, 'calls', callId), { status: 'resolved' });
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (itemData: Omit<OrderItem, 'id'>) => {
    setCart((prev) => {
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

  const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    if (!isAuthReady) return;
    const newItem: MenuItem = { ...itemData, id: Math.random().toString(36).substring(2, 9) };
    try {
      await setDoc(doc(collection(db, 'menu'), newItem.id), newItem);
    } catch (e) {
      console.error(e);
    }
  };

  const updateMenuItem = async (id: string, itemData: Partial<MenuItem>) => {
    if (!isAuthReady) return;
    try {
      await updateDoc(doc(db, 'menu', id), itemData);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!isAuthReady) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = async () => {
    if (!isAuthReady) return;
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const callsSnap = await getDocs(collection(db, 'calls'));
      
      const batch = writeBatch(db);
      ordersSnap.docs.forEach(doc => batch.delete(doc.ref));
      callsSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!isAuthReady) return;
    const newExpense: Expense = {
      ...expenseData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(collection(db, 'expenses'), newExpense.id), newExpense);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!isAuthReady) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    if (!isAuthReady) return;
    try {
      await updateDoc(doc(db, 'settings', 'global'), newSettings);
    } catch (e) {
      console.error(e);
    }
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
