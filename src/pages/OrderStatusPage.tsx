import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ChefHat, BellRing, Utensils, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { OrderStatus } from '../types';
import ThemeToggle from '../components/ThemeToggle';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'received', label: 'Erhalten', icon: CheckCircle2 },
  { status: 'preparing', label: 'In Zubereitung', icon: ChefHat },
  { status: 'ready', label: 'Fertig', icon: BellRing },
  { status: 'served', label: 'Serviert', icon: Utensils },
];

export default function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table') || '1';
  const navigate = useNavigate();
  const { orders } = useStore();

  // Get the most recent order for this table
  const tableOrders = orders.filter(o => o.table === table).sort((a, b) => b.createdAt - a.createdAt);
  const currentOrder = tableOrders[0];

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Keine aktive Bestellung</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Sie haben noch keine Bestellung aufgegeben.</p>
        <button 
          onClick={() => navigate(`/menu?table=${table}`)}
          className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          Zum Menü
        </button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === currentOrder.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50 dark:bg-[#111]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/menu?table=${table}`)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bestellstatus</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tisch {table} • #{currentOrder.id}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-8 mt-4">
        {/* Status Tracker */}
        <section className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-[1.1rem] top-8 bottom-8 w-0.5 bg-[#333]" />
            <div 
              className="absolute left-[1.1rem] top-8 w-0.5 bg-red-600 transition-all duration-500"
              style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />

            <div className="space-y-8 relative">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex items-center gap-6">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${
                        isCompleted ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-[#333] text-gray-500'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg transition-colors duration-500 ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-red-500 mt-1"
                        >
                          {step.status === 'received' && 'Ihre Bestellung ist in der Küche eingegangen.'}
                          {step.status === 'preparing' && 'Unsere Köche bereiten Ihr Essen frisch zu.'}
                          {step.status === 'ready' && 'Ihr Essen ist fertig und wird gleich serviert.'}
                          {step.status === 'served' && 'Guten Appetit!'}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-bold mb-4 text-gray-300">Bestelldetails</h2>
          <div className="space-y-4 mb-6">
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                    {item.quantity}x
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10">
            <span className="text-lg font-bold">Gesamtsumme</span>
            <span className="text-2xl font-bold text-red-500">{formatCurrency(currentOrder.total)}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
