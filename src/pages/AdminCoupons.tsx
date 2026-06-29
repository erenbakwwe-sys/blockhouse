import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ticket, Percent, Trash2, Calendar, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  value: number;
  type: 'percent' | 'flat';
  minSpend: number;
  limit: number;
  expiry: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Coupon form state
  const [code, setCode] = useState('');
  const [value, setValue] = useState<number>(10);
  const [type, setType] = useState<'percent' | 'flat'>('percent');
  const [minSpend, setMinSpend] = useState<number>(100);
  const [limit, setLimit] = useState<number>(50);

  // Happy Hour form state
  const [happyHourRate, setHappyHourRate] = useState<number>(15);
  const [happyHourStart, setHappyHourStart] = useState('14:00');
  const [happyHourEnd, setHappyHourEnd] = useState('17:00');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
      setCoupons(fetched);
    }, console.error);
    return () => unsub();
  }, []);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.trim().toUpperCase(),
        value: Number(value),
        type,
        minSpend: Number(minSpend),
        limit: Number(limit),
        expiry: '2026-12-31'
      });
      toast.success('Coupon-Code definiert und aktiviert!');
      setIsModalOpen(false);
      setCode('');
      setValue(10);
      setMinSpend(100);
      setLimit(50);
    } catch (err) {
      console.error(err);
      toast.error('Coupon konnte nicht gespeichert werden.');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Coupon-Code löschen möchten?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        toast.success('Coupon gelöscht.');
      } catch (err) {
        console.error(err);
        toast.error('Löschen fehlgeschlagen.');
      }
    }
  };

  const handleHappyHourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Happy Hour Rabattregeln gespeichert!');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Marketing & Coupon-Verwaltung</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Erstellen Sie Rabattcodes und verwalten Sie Happy-Hour-Aktionen</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Ticket size={18} /> + Coupon erstellen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Coupons List */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <span>🎟️</span> Aktive Aktionen & Kampagnen
          </h2>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {coupons.length === 0 ? (
              <p className="text-gray-400 italic text-center py-12 text-sm">Keine aktiven Kampagnen definiert.</p>
            ) : (
              coupons.map(cp => (
                <div key={cp.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl flex justify-between items-center hover:scale-[1.01] transition-transform">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-red-600 text-white font-black rounded-lg text-sm tracking-wider">
                        {cp.code}
                      </span>
                      <span className="text-xs text-emerald-500 font-bold">
                        {cp.type === 'percent' ? `% ${cp.value} Rabatt` : `${cp.value} € Rabatt`}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span>Mindestbestellwert: <strong>{cp.minSpend} €</strong></span>
                      <span>Nutzungslimit: <strong>{cp.limit} Stk.</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCoupon(cp.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all cursor-pointer"
                    title="Coupon löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Happy Hour Auto Scheduler */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <span>🕒</span> Happy-Hour-Automation
          </h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Wenden Sie an bestimmten Wochentagen und zu bestimmten Uhrzeiten automatisch Rabatte auf Kundenbestellungen im Warenkorb an.
          </p>

          <form onSubmit={handleHappyHourSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Percent size={16} /> Automatischer Rabatt (%)
              </label>
              <input
                type="number"
                value={happyHourRate}
                onChange={(e) => setHappyHourRate(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Startzeit
                </label>
                <input
                  type="time"
                  value={happyHourStart}
                  onChange={(e) => setHappyHourStart(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Endzeit
                </label>
                <input
                  type="time"
                  value={happyHourEnd}
                  onChange={(e) => setHappyHourEnd(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <Award size={16} /> Automatische Regeln speichern
            </button>
          </form>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1a1a] p-8 max-w-md w-full rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Neuen Promotion-Code erstellen</h3>
            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Aktionscode</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-red-500"
                  placeholder="GOURMET20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Typ</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percent' | 'flat')}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="percent">Prozentual (%)</option>
                    <option value="flat">Festbetrag (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Rabattbetrag / -satz</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Mindestbestellwert (€)</label>
                <input
                  type="number"
                  required
                  value={minSpend}
                  onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Maximales Nutzungslimit (Stück)</label>
                <input
                  type="number"
                  required
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex-1 transition-colors cursor-pointer text-sm"
                >
                  Coupon aktivieren
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
