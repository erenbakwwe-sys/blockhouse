import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Trash2, Edit3, AlertTriangle, ShieldCheck, DollarSign, ListOrdered } from 'lucide-react';
import toast from 'react-hot-toast';

interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  remaining: number;
  unitCost: number;
}

export default function AdminStock() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('gr');
  const [qty, setQty] = useState<number>(1000);
  const [remaining, setRemaining] = useState<number>(1000);
  const [unitCost, setUnitCost] = useState<number>(0.1);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stock'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      setStock(fetched);
    }, console.error);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedId(null);
    setName('');
    setUnit('gr');
    setQty(1000);
    setRemaining(1000);
    setUnitCost(0.1);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setModalMode('edit');
    setSelectedId(item.id);
    setName(item.name);
    setUnit(item.unit);
    setQty(item.qty);
    setRemaining(item.remaining);
    setUnitCost(item.unitCost);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name,
      unit,
      qty: Number(qty),
      remaining: Number(remaining),
      unitCost: Number(unitCost)
    };

    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, 'stock'), data);
        toast.success('Hinzugefügt zum Lagerbestand.');
      } else if (modalMode === 'edit' && selectedId) {
        await updateDoc(doc(db, 'stock', selectedId), data);
        toast.success('Lagerbestand aktualisiert.');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Speichern fehlgeschlagen.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Zutat aus dem Lagerbestand löschen möchten?')) {
      try {
        await deleteDoc(doc(db, 'stock', id));
        toast.success('Zutat entfernt.');
      } catch (err) {
        console.error(err);
        toast.error('Löschen fehlgeschlagen.');
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Zutaten & Inventar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lagerbestand, Alarme für kritische Mengen und Stückkostenanalyse</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Package size={18} /> + Zutat hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total inventory valuation */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">GESAMTER LAGERWERT</p>
          <p className="text-2xl font-black text-emerald-500 mt-2">
            {stock.reduce((sum, s) => sum + (s.remaining * s.unitCost), 0).toFixed(2)} €
          </p>
        </div>

        {/* Total distinct raw materials */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ZUTATENTYPEN</p>
          <p className="text-2xl font-black mt-2">{stock.length} Artikel</p>
        </div>

        {/* Critical alert counter */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">KRITISCHER BESTAND (ARTIKEL)</p>
          <p className="text-2xl font-black text-red-500 mt-2">
            {stock.filter(s => s.remaining <= s.qty * 0.2).length} Artikel
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/1 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
                <th className="p-4">Zutatenname</th>
                <th className="p-4">Einheit</th>
                <th className="p-4">Anfangsmenge</th>
                <th className="p-4">Verbleibend</th>
                <th className="p-4">Stückkosten</th>
                <th className="p-4">Verbleibender Wert</th>
                <th className="p-4">Status</th>
                <th className="p-4">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {stock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                    Es wurden noch keine Zutaten hinzugefügt. Verwenden Sie die Schaltfläche oben, um Ihre erste Zutat hinzuzufügen.
                  </td>
                </tr>
              ) : (
                stock.map(s => {
                  const isCritical = s.remaining <= s.qty * 0.2;
                  const isOut = s.remaining <= 0;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/1">
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                      <td className="p-4">{s.unit}</td>
                      <td className="p-4">{s.qty}</td>
                      <td className={`p-4 font-extrabold ${isCritical ? 'text-red-500' : ''}`}>
                        {s.remaining}
                      </td>
                      <td className="p-4">{s.unitCost.toFixed(2)} €</td>
                      <td className="p-4">{(s.remaining * s.unitCost).toFixed(2)} €</td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-red-600/20 text-red-500 border border-red-500/30">Ausverkauft</span>
                        ) : isCritical ? (
                          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">Kritisch</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Sicher</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-blue-500 transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 bg-gray-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                            title="Löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1a1a] p-8 max-w-md w-full rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">
              {modalMode === 'add' ? 'Zutat hinzufügen' : 'Zutat bearbeiten'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Zutatenname</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  placeholder="Z.B. Filet"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Einheit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                    placeholder="g, kg, Stk."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Stückkosten (€)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Anfangsmenge</label>
                  <input
                    type="number"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Verbleibend</label>
                  <input
                    type="number"
                    required
                    value={remaining}
                    onChange={(e) => setRemaining(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex-1 transition-colors cursor-pointer text-sm"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-3 px-6 rounded-xl flex-1 transition-colors cursor-pointer text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
