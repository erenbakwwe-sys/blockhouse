// Mock Database Interceptor for Demo Mode (stores data in localStorage/memory)
import { initialMenu } from '../data/menu'; // Fallback raw initial data if needed

export interface MockStore {
  users: Record<string, any>;
  menuItems: Record<string, any[]>;
  orders: Record<string, any[]>;
  calls: Record<string, any[]>;
  stock: Record<string, any[]>;
  tabs: Record<string, any[]>;
  staff: Record<string, any[]>;
  coupons: Record<string, any[]>;
  privateSettings: Record<string, any>;
}

const LOCAL_STORAGE_KEY = "saas_qr_mock_db";

const initialMockData: MockStore = {
  users: {
    "demo": {
      restaurantName: "BLOCK HOUSE",
      email: "demo@blockhouse.com",
      phone: "+90 212 555 1234",
      address: "Nişantaşı, İstanbul",
      themePreset: "fineDining",
      themeColors: {
        bg: "#0a0a0f",
        glassBg: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.06)",
        primary: "#6c5ce7",
        accent: "#a29bfe",
        success: "#00b894",
        danger: "#ff7675",
        textPrimary: "#ffffff",
        textSecondary: "#a0a0ab"
      }
    }
  },
  menuItems: {
    "demo": [
      { id: "m1", category: "Steak & Grill", name: "Premium Filet Mignon", price: 850, emoji: "🥩", description: "Yumuşacık 220g bonfile, taze baharatlı tereyağı ve fırın patates ile", ingredients: [{ materialId: "s1", qty: 220 }] },
      { id: "m2", category: "Steak & Grill", name: "Ribeye Steak", price: 790, emoji: "🥩", description: "Mükemmel mermersi doku, 300g dana antrikot, kuştüyü tuz ve biber ile", ingredients: [{ materialId: "s1", qty: 300 }] },
      { id: "m3", category: "Burgers", name: "Block Burger", price: 340, emoji: "🍔", description: "180g özel burger köftesi, karamelize soğan, cheddar peyniri ve özel sos", ingredients: [{ materialId: "s2", qty: 180 }, { materialId: "s3", qty: 40 }, { materialId: "s4", qty: 1 }] },
      { id: "m4", category: "Appetizers", name: "Truffle Fries", price: 160, emoji: "🍟", description: "Trüf yağı, rendelenmiş parmesan ve ince kıyılmış taze frenk soğanı", ingredients: [{ materialId: "s5", qty: 200 }] },
      { id: "m5", category: "Drinks", name: "Craft Lemonade", price: 90, emoji: "🍹", description: "Taze sıkılmış limon, nane yaprakları ve organik bal tatlandırıcı", ingredients: [] },
      { id: "m6", category: "Drinks", name: "Red Wine (Glass)", price: 220, emoji: "🍷", description: "Premium mahzen eseri kırmızı sek şarap", ingredients: [] }
    ]
  },
  stock: {
    "demo": [
      { id: "s1", name: "Dana Bonfile", unit: "gr", qty: 15000, remaining: 12400, unitCost: 1.2 }, // 12.4kg left, cost 1.2 TL per gr
      { id: "s2", name: "Burger Köftesi", unit: "gr", qty: 10000, remaining: 1500, unitCost: 0.8 }, // 1.5kg left -> Critical!
      { id: "s3", name: "Karamelize Soğan", unit: "gr", qty: 3000, remaining: 200, unitCost: 0.1 },  // Critical!
      { id: "s4", name: "Burger Ekmeği", unit: "adet", qty: 100, remaining: 65, unitCost: 15 },
      { id: "s5", name: "Patates", unit: "gr", qty: 50000, remaining: 42000, unitCost: 0.05 }
    ]
  },
  orders: {
    "demo": [
      { id: "o1", table: "2", status: "completed", items: [{ menuItemId: "m3", name: "Block Burger", price: 340, quantity: 2 }, { menuItemId: "m5", name: "Craft Lemonade", price: 90, quantity: 2 }], total: 860, createdAt: Date.now() - 3600000 * 2, paymentType: "card" },
      { id: "o2", table: "4", status: "preparing", items: [{ menuItemId: "m1", name: "Premium Filet Mignon", price: 850, quantity: 1 }, { menuItemId: "m6", name: "Red Wine (Glass)", price: 220, quantity: 1 }], total: 1070, createdAt: Date.now() - 900000, notes: "Bonfile orta-az pişmiş olsun lütfen.", paymentType: "cash" },
      { id: "o3", table: "1", status: "received", items: [{ menuItemId: "m4", name: "Truffle Fries", price: 160, quantity: 1 }], total: 160, createdAt: Date.now() - 300000, paymentType: "split" }
    ]
  },
  calls: {
    "demo": [
      { id: "c1", table: "3", status: "active", createdAt: Date.now() - 120000 }
    ]
  },
  tabs: {
    "demo": [
      { id: "t2", table: "2", items: [{ id: "m3", name: "Block Burger", price: 340, quantity: 2 }, { id: "m5", name: "Craft Lemonade", price: 90, quantity: 2 }], discount: 0, tip: 40, active: true, createdAt: Date.now() - 3600000 * 2 },
      { id: "t4", table: "4", items: [{ id: "m1", name: "Premium Filet Mignon", price: 850, quantity: 1 }, { id: "m6", name: "Red Wine (Glass)", price: 220, quantity: 1 }], discount: 50, tip: 100, active: true, createdAt: Date.now() - 3600000 },
      { id: "t5", table: "5", items: [], discount: 0, tip: 0, active: false, createdAt: Date.now() }
    ]
  },
  staff: {
    "demo": [
      { id: "st1", name: "Ahmet Yılmaz", pin: "1234", role: "Garson" },
      { id: "st2", name: "Merve Çelik", pin: "5678", role: "Kasa/Yönetici" }
    ]
  },
  coupons: {
    "demo": [
      { id: "cp1", code: "WELCOME10", type: "percent", value: 10, minSpend: 200, limit: 100, expiry: "2026-12-31" },
      { id: "cp2", code: "STEAK50", type: "flat", value: 50, minSpend: 500, limit: 50, expiry: "2026-08-30" }
    ]
  },
  privateSettings: {
    "demo": {
      happyHours: [
        { id: "hh1", label: "Sunset Happy Hour", start: "14:00", end: "17:00", discount: 15 }
      ]
    }
  }
};

export class MockDatabase {
  private store: MockStore;

  constructor() {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        this.store = JSON.parse(cached);
      } catch {
        this.store = initialMockData;
      }
    } else {
      this.store = initialMockData;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.store));
    // Trigger real-time callback triggers to simulate Firestore onSnapshot listeners
    window.dispatchEvent(new CustomEvent('mockdb_update'));
  }

  getDoc(collection: string, id: string): any {
    const userDb = this.store[collection as keyof MockStore];
    if (collection === 'users') {
      return this.store.users[id] || null;
    }
    return null;
  }

  getCollection(collection: string, userId: string): any[] {
    const col = this.store[collection as keyof MockStore];
    if (col && typeof col === 'object') {
      return (col as any)[userId] || [];
    }
    return [];
  }

  setDoc(collection: string, userId: string, data: any, id?: string): string {
    const col = this.store[collection as keyof MockStore] as any;
    if (!col) return "";
    
    if (collection === 'users') {
      this.store.users[userId] = { ...this.store.users[userId], ...data };
      this.save();
      return userId;
    }

    if (!col[userId]) {
      col[userId] = [];
    }

    const docId = id || Math.random().toString(36).substring(2, 11);
    const existingIndex = col[userId].findIndex((item: any) => item.id === docId);
    
    const newDoc = { id: docId, ...data };
    if (existingIndex >= 0) {
      col[userId][existingIndex] = newDoc;
    } else {
      col[userId].push(newDoc);
    }

    this.save();
    return docId;
  }

  addDoc(collection: string, userId: string, data: any): string {
    return this.setDoc(collection, userId, data);
  }

  updateDoc(collection: string, userId: string, id: string, data: any) {
    const col = this.store[collection as keyof MockStore] as any;
    if (col && col[userId]) {
      const idx = col[userId].findIndex((item: any) => item.id === id);
      if (idx >= 0) {
        col[userId][idx] = { ...col[userId][idx], ...data };
        this.save();
      }
    }
  }

  deleteDoc(collection: string, userId: string, id: string) {
    const col = this.store[collection as keyof MockStore] as any;
    if (col && col[userId]) {
      col[userId] = col[userId].filter((item: any) => item.id !== id);
      this.save();
    }
  }

  subscribe(callback: () => void): () => void {
    window.addEventListener('mockdb_update', callback);
    return () => {
      window.removeEventListener('mockdb_update', callback);
    };
  }
}

export const mockDbInstance = new MockDatabase();
