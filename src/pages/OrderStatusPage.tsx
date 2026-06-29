import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ChefHat, BellRing, Utensils, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { OrderStatus } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import { TRANSLATIONS } from '../lib/translations';
import ScratchCardGame from '../components/ScratchCardGame';

export default function OrderStatusPage() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table') || '1';
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { orders, language, tables } = useStore();
  const t = TRANSLATIONS[language];

  // Verify token
  const [isValidTable, setIsValidTable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (tables.length > 0) {
      const tableData = tables.find(t => t.number === table);
      if (tableData) {
        if (tableData.token) {
          setIsValidTable(tableData.token === token);
        } else {
          setIsValidTable(true);
        }
      } else {
        setIsValidTable(false);
      }
    }
  }, [tables, table, token]);

  const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
    { status: 'received', label: t.statusReceived, icon: CheckCircle2 },
    { status: 'preparing', label: t.statusPreparing, icon: ChefHat },
    { status: 'ready', label: t.statusReady, icon: BellRing },
    { status: 'served', label: t.statusServed, icon: Utensils },
  ];

  // Get the most recent order for this table
  const tableOrders = orders.filter(o => o.table === table).sort((a, b) => b.createdAt - a.createdAt);
  const currentOrder = tableOrders[0];

  if (isValidTable === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-white/5">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">{t.invalidQR.split('.')[0]}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t.invalidQR}
          </p>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">{t.noActiveOrder}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">{t.noActiveOrderDesc}</p>
        <button 
          onClick={() => navigate(`/menu?table=${table}`)}
          className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          {t.backToMenu}
        </button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === currentOrder.status);

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black pb-24 selection:bg-[#007aff]/20 antialiased tracking-tight">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/menu?table=${table}`)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={18} className="text-[#1c1c1e] dark:text-white" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#1c1c1e] dark:text-white">{t.orderStatus}</h1>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tisch {table} • #{currentOrder.id}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Interactive Scratch Card Game */}
        <ScratchCardGame orderId={currentOrder.id} table={table} />

        {/* Status Tracker */}
        <section className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] border border-black/5 dark:border-white/10 shadow-sm">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-[1.1rem] top-8 bottom-8 w-0.5 bg-black/10 dark:bg-white/10" />
            <div 
              className="absolute left-[1.1rem] top-8 w-0.5 bg-[#007aff] dark:bg-[#0a84ff] transition-all duration-500"
              style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />

            <div className="space-y-7 relative">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex items-center gap-5">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-[#007aff] dark:bg-[#0a84ff] text-white shadow-sm scale-110' 
                          : 'bg-black/5 dark:bg-[#2c2c2e] text-gray-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm transition-colors duration-500 ${isCompleted ? 'text-gray-950 dark:text-white' : 'text-gray-400'}`}>
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed max-w-md"
                        >
                          {step.status === 'received' && t.statusReceivedDesc}
                          {step.status === 'preparing' && t.statusPreparingDesc}
                          {step.status === 'ready' && t.statusReadyDesc}
                          {step.status === 'served' && t.statusServedDesc}
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
        <section className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-black/5 dark:border-white/10 shadow-sm">
          <h2 className="text-xs font-bold mb-3.5 text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">{t.orderDetails}</h2>
          <div className="space-y-3 mb-4">
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-black/[0.03] dark:border-white/[0.03] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-5.5 h-5.5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[10px] font-extrabold text-[#007aff] dark:text-[#0a84ff]">
                    {item.quantity}x
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-3.5 border-t border-black/5 dark:border-white/5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.total}</span>
            <span className="text-lg font-black text-[#ff3b30]">{formatCurrency(currentOrder.total)}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
