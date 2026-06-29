import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { collection, onSnapshot, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CreditCard, DollarSign, Printer, Scissors, Plus, Minus, Star, Coffee, Smartphone, Package, Search, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { printThermalReceipt } from '../lib/printReceipt';

interface POSItem {
  name: string;
  price: number;
  quantity: number;
}

interface TableTab {
  id: string;
  table: string;
  items: POSItem[];
  discount: number;
  tip: number;
  active: boolean;
}

interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  remaining: number;
  unitCost: number;
}

export default function AdminPOS() {
  const { menu, addOrder } = useStore();
  const [tabs, setTabs] = useState<TableTab[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [splitPersons, setSplitPersons] = useState<number | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptTab, setReceiptTab] = useState<TableTab | null>(null);

  // Quick Action Stock Modal State
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [editingStockValues, setEditingStockValues] = useState<Record<string, number>>({});

  // Sound Synthesizers for POS
  const playPrinterSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const noise = Math.random() * 2 - 1;
        const timeMs = (i / ctx.sampleRate) * 1000;
        const isActive = (timeMs % 55) < 40;
        data[i] = isActive ? noise * 0.1 : 0;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn("Audio Context blocked");
    }
  };

  // Listen to tabs collection in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tabs'), (snapshot) => {
      const fetchedTabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableTab));
      setTabs(fetchedTabs);
    }, console.error);
    return () => unsub();
  }, []);

  // Listen to stock collection in real-time
  useEffect(() => {
    const unsubStock = onSnapshot(collection(db, 'stock'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      setStockList(fetched);
      setEditingStockValues(prev => {
        const next = { ...prev };
        fetched.forEach(item => {
          if (next[item.id] === undefined) {
            next[item.id] = item.remaining;
          }
        });
        return next;
      });
    }, console.error);
    return () => unsubStock();
  }, []);

  const handleQuickAdjustStock = async (itemId: string) => {
    try {
      const val = editingStockValues[itemId];
      if (val === undefined || isNaN(val)) return;
      const parsedVal = Math.max(0, Number(val));
      await updateDoc(doc(db, 'stock', itemId), { remaining: parsedVal });
      toast.success('Bestand erfolgreich aktualisiert.');
    } catch (err) {
      console.error(err);
      toast.error('Aktualisierung fehlgeschlagen.');
    }
  };

  const tableNumbers = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const activeTab = tabs.find(t => t.table === selectedTable && t.active);
  const subtotal = activeTab ? activeTab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
  const discountAmount = activeTab ? activeTab.discount : 0;
  const tipAmount = activeTab ? activeTab.tip : 0;
  const total = Math.max(0, subtotal - discountAmount + tipAmount);

  const openTablePOS = async (tableNo: string) => {
    setSelectedTable(tableNo);
    setSplitPersons(null);
    const existing = tabs.find(t => t.table === tableNo && t.active);
    if (!existing) {
      const id = 'tab_' + tableNo + '_' + Date.now();
      const newTab: TableTab = {
        id,
        table: tableNo,
        items: [],
        discount: 0,
        tip: 0,
        active: true
      };
      await setDoc(doc(db, 'tabs', id), newTab);
    }
  };

  const addPOSItem = async (name: string, price: number) => {
    if (!activeTab || !selectedTable) return;
    const items = [...activeTab.items];
    const existingIdx = items.findIndex(item => item.name === name);
    if (existingIdx >= 0) {
      items[existingIdx].quantity += 1;
    } else {
      items.push({ name, price, quantity: 1 });
    }
    await updateDoc(doc(db, 'tabs', activeTab.id), { items });
  };

  const changePOSQty = async (idx: number, delta: number) => {
    if (!activeTab) return;
    const items = [...activeTab.items];
    items[idx].quantity += delta;
    if (items[idx].quantity <= 0) {
      items.splice(idx, 1);
    }
    await updateDoc(doc(db, 'tabs', activeTab.id), { items });
  };

  const toggleComplimentary = async (idx: number) => {
    if (!activeTab) return;
    const items = [...activeTab.items];
    items[idx].price = 0;
    await updateDoc(doc(db, 'tabs', activeTab.id), { items });
    toast.success('Artikel aufs Haus gesetzt');
  };

  const updatePOSBillExtras = async (field: 'discount' | 'tip', val: string) => {
    if (!activeTab) return;
    const numVal = parseFloat(val) || 0;
    await updateDoc(doc(db, 'tabs', activeTab.id), { [field]: numVal });
  };

  const finalizePOSBill = async (paymentType: 'cash' | 'card' | 'pos') => {
    if (!activeTab || !selectedTable) return;

    // 1. Mark tab as inactive
    await updateDoc(doc(db, 'tabs', activeTab.id), { active: false });

    // 2. Log closed order in orders database for finance analytics
    await addOrder({
      table: selectedTable,
      status: 'served', // using standard type mapping
      items: activeTab.items.map(i => ({
        id: Math.random().toString(36).substring(2, 9),
        menuItemId: 'pos_direct',
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      total,
      paymentMethod: paymentType,
      paymentType: paymentType
    });

    const paymentLabel = paymentType === 'cash' ? 'Bar' : paymentType === 'card' ? 'Kreditkarte' : 'Mobiles POS';
    toast.success(`Zahlung erhalten (${paymentLabel}), Tisch geschlossen!`);
    setSelectedTable(null);
  };

  const handlePrintReceipt = () => {
    if (!activeTab) return;
    playPrinterSound();
    setReceiptTab(activeTab);
    setIsReceiptOpen(true);
  };

  const handlePhysicalPrint = (tab: TableTab) => {
    const subtotal = tab.items.reduce((s, item) => s + (item.price * item.quantity), 0);
    printThermalReceipt({
      table: tab.table,
      id: tab.id,
      createdAt: Date.now(),
      items: tab.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: subtotal,
      discount: tab.discount,
      tip: tab.tip,
      total: Math.max(0, subtotal - tab.discount + tab.tip),
    });
  };

  return (
    <div className="p-4 md:p-8 font-sans max-w-7xl mx-auto text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tischabrechnung & POS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live-Tische & Schnelles Abrechnungsterminal</p>
        </div>
        <button
          onClick={() => setIsStockModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/10"
        >
          <Package size={18} /> Bestände anpassen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Map */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🪑</span> Tischplan & Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tableNumbers.map(no => {
              const tab = tabs.find(t => t.table === no && t.active);
              const billAmount = tab ? tab.items.reduce((s, item) => s + (item.price * item.quantity), 0) : 0;
              const isSelected = selectedTable === no;

              return (
                <button
                  key={no}
                  onClick={() => openTablePOS(no)}
                  className={`p-6 rounded-2xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    isSelected 
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20' 
                      : tab 
                        ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="text-2xl mb-1">🍽️</span>
                  <span className="font-extrabold text-lg">Tisch {no}</span>
                  <span className="text-xs font-semibold opacity-80 mt-1">
                    {tab ? `${billAmount} €` : 'Frei'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* POS Side Panel / Billing */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
          {selectedTable ? (
            activeTab ? (
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-150 dark:border-white/5 mb-6">
                  <h2 className="text-2xl font-bold">Tisch {selectedTable} - Rechnung</h2>
                  <span className="px-3 py-1 text-xs bg-red-600 text-white font-bold rounded-full">Offen</span>
                </div>

                {/* Items in Tab */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Rechnungsposten</h3>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {activeTab.items.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-6">Noch keine Bestellungen eingegeben.</p>
                    ) : (
                      activeTab.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-150 dark:border-white/5">
                          <div>
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.price} € / Stk.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => changePOSQty(idx, -1)} className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20">
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-sm px-1">{item.quantity}</span>
                            <button onClick={() => changePOSQty(idx, 1)} className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20">
                              <Plus size={14} />
                            </button>
                            <button onClick={() => toggleComplimentary(idx)} className="text-xs font-semibold text-yellow-500 hover:underline ml-2">
                              Aufs Haus
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Add Menu Items */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Schnelle Produkteingabe</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {menu.map(m => (
                      <button
                        key={m.id}
                        onClick={() => addPOSItem(m.name, m.price)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-red-500 rounded-xl text-xs font-medium cursor-pointer flex-shrink-0"
                      >
                        {m.name} ({m.price} €)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount & Tip Fields */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Rabatt (€)</label>
                    <input
                      type="number"
                      value={discountAmount || ''}
                      onChange={(e) => updatePOSBillExtras('discount', e.target.value)}
                      className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Trinkgeld (€)</label>
                    <input
                      type="number"
                      value={tipAmount || ''}
                      onChange={(e) => updatePOSBillExtras('tip', e.target.value)}
                      className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Splitting Bill */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-6 border border-gray-150 dark:border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm text-gray-500">Rechnung aufteilen</p>
                    <Scissors className="text-gray-400" size={16} />
                  </div>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map(p => (
                      <button
                        key={p}
                        onClick={() => setSplitPersons(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${splitPersons === p ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                      >
                        {p} Personen
                      </button>
                    ))}
                  </div>
                  {splitPersons && (
                    <p className="text-sm font-extrabold text-emerald-500 mt-2">
                      Pro Person: {(total / splitPersons).toFixed(2)} €
                    </p>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-2 border-t border-gray-200 dark:border-white/10 pt-4 mb-6">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Zwischensumme:</span>
                    <span>{subtotal} €</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Rabatt:</span>
                      <span>-{discountAmount} €</span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Trinkgeld:</span>
                      <span>+{tipAmount} €</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-extrabold text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                    <span>Gesamtsumme:</span>
                    <span className="text-2xl text-emerald-500">{total} €</span>
                  </div>
                </div>

                {/* Payment Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => finalizePOSBill('cash')}
                      disabled={activeTab.items.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-1 rounded-xl transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <DollarSign size={16} /> Bar
                    </button>
                    <button
                      onClick={() => finalizePOSBill('card')}
                      disabled={activeTab.items.length === 0}
                      className="bg-[#007aff] hover:bg-[#0063cc] text-white font-bold py-3 px-1 rounded-xl transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <CreditCard size={16} /> Karte (Web)
                    </button>
                    <button
                      onClick={() => finalizePOSBill('pos')}
                      disabled={activeTab.items.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-1 rounded-xl transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <Smartphone size={16} /> Mobiler POS
                    </button>
                  </div>
                  <button
                    onClick={handlePrintReceipt}
                    className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} /> Beleg drucken (Simulator)
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center py-12 text-gray-400">Laden...</p>
            )
          ) : (
            <div className="text-center py-24">
              <span className="text-4xl block mb-4">🪑</span>
              <p className="font-bold text-lg">Kein Tisch ausgewählt</p>
              <p className="text-sm text-gray-400 mt-1">Klicken Sie links auf einen Tisch, um die Abrechnung zu starten.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Ticket Receipt Modal */}
      {isReceiptOpen && receiptTab && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-black p-6 rounded-lg max-w-sm w-full font-mono shadow-2xl border-2 border-gray-300">
            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h2 className="text-lg font-black tracking-widest font-mono">RECHNUNG / BELEG</h2>
              <p className="text-xs uppercase font-bold text-gray-600 mt-1">BLOCK HOUSE STEAKHOUSE</p>
            </div>

            <div className="text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Datum:</span>
                <span>{new Date().toLocaleDateString('de-DE')}</span>
              </div>
              <div className="flex justify-between">
                <span>Uhrzeit:</span>
                <span>{new Date().toLocaleTimeString('de-DE')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Tisch:</span>
                <span>Tisch {receiptTab.table}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
              <div className="text-xs grid grid-cols-4 font-bold uppercase pb-1">
                <span className="col-span-2">Artikel</span>
                <span className="text-center">Menge</span>
                <span className="text-right">Betrag</span>
              </div>
              <div className="space-y-1">
                {receiptTab.items.map((i, idx) => (
                  <div key={idx} className="text-xs grid grid-cols-4">
                    <span className="col-span-2 truncate">{i.name}</span>
                    <span className="text-center">x{i.quantity}</span>
                    <span className="text-right">{i.price * i.quantity} €</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs space-y-1 border-b border-dashed border-gray-300 pb-2 mb-4">
              <div className="flex justify-between">
                <span>Zwischensumme:</span>
                <span>{receiptTab.items.reduce((s, item) => s + (item.price * item.quantity), 0)} €</span>
              </div>
              {receiptTab.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Rabatt:</span>
                  <span>-{receiptTab.discount} €</span>
                </div>
              )}
              {receiptTab.tip > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Trinkgeld:</span>
                  <span>+{receiptTab.tip} €</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-black text-base uppercase mb-6">
              <span>Gesamt:</span>
              <span>
                {Math.max(0, receiptTab.items.reduce((s, item) => s + (item.price * item.quantity), 0) - receiptTab.discount + receiptTab.tip)} €
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handlePhysicalPrint(receiptTab)}
                className="w-full bg-[#007aff] hover:bg-[#0063cc] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={14} /> Beleg drucken (Physisch)
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Stock adjustment modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white p-6 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-white/5 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div>
                  <h2 className="text-xl font-bold">Lagerbestände anpassen</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Zutatenmengen live kontrollieren und korrigieren</p>
                </div>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500 hover:text-gray-800 dark:hover:text-white" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Zutat suchen..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* List of Stock items */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
              {stockList.filter(item => item.name.toLowerCase().includes(stockSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm italic">Keine passenden Zutaten gefunden.</p>
                </div>
              ) : (
                stockList
                  .filter(item => item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()))
                  .map(item => {
                    const currentEditingVal = editingStockValues[item.id] !== undefined ? editingStockValues[item.id] : item.remaining;
                    const isChanged = currentEditingVal !== item.remaining;
                    const isCritical = item.remaining <= item.qty * 0.2;

                    const handleIncrement = (amount: number) => {
                      setEditingStockValues(prev => ({
                        ...prev,
                        [item.id]: Math.max(0, (prev[item.id] !== undefined ? prev[item.id] : item.remaining) + amount)
                      }));
                    };

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{item.name}</span>
                            {isCritical && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase tracking-wider animate-pulse">
                                Niedrig
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              Ist: <strong className="text-gray-700 dark:text-gray-300 font-semibold">{item.remaining} {item.unit}</strong>
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              Soll: {item.qty} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Adjust controls */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Quick adjustment buttons */}
                          <div className="flex items-center bg-gray-200/60 dark:bg-white/5 rounded-xl p-0.5 border border-gray-200/40 dark:border-white/5">
                            <button
                              onClick={() => handleIncrement(item.unit === 'gr' || item.unit === 'ml' ? -100 : -1)}
                              className="px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                            >
                              {item.unit === 'gr' || item.unit === 'ml' ? '-100' : '-1'}
                            </button>
                            <button
                              onClick={() => handleIncrement(item.unit === 'gr' || item.unit === 'ml' ? -10 : -5)}
                              className="px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                            >
                              {item.unit === 'gr' || item.unit === 'ml' ? '-10' : '-5'}
                            </button>
                            <button
                              onClick={() => handleIncrement(item.unit === 'gr' || item.unit === 'ml' ? 10 : 5)}
                              className="px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                            >
                              {item.unit === 'gr' || item.unit === 'ml' ? '+10' : '+5'}
                            </button>
                            <button
                              onClick={() => handleIncrement(item.unit === 'gr' || item.unit === 'ml' ? 100 : 1)}
                              className="px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-all"
                            >
                              {item.unit === 'gr' || item.unit === 'ml' ? '+100' : '+1'}
                            </button>
                          </div>

                          {/* Custom input and save button */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={currentEditingVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                setEditingStockValues(prev => ({ ...prev, [item.id]: val }));
                              }}
                              className="w-20 px-2.5 py-1.5 bg-white dark:bg-[#121212] border border-gray-250 dark:border-white/10 rounded-xl text-center font-extrabold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-gray-400 font-semibold w-5">{item.unit}</span>

                            <button
                              onClick={() => handleQuickAdjustStock(item.id)}
                              disabled={!isChanged}
                              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                                isChanged
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 cursor-pointer scale-105'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed opacity-40'
                              }`}
                              title="Speichern"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4 flex justify-end">
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer text-sm"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
