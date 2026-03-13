import { useStore } from '../store/StoreContext';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export default function AdminCalls() {
  const { calls, resolveCall } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCalls = calls.filter(c => c.status === 'active').sort((a, b) => b.createdAt - a.createdAt);
  const resolvedCalls = calls.filter(c => c.status === 'resolved').sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);

  const formatWaitTime = (createdAt: number) => {
    const diff = Math.floor((now - createdAt) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOverdue = (createdAt: number) => {
    return (now - createdAt) > 2 * 60 * 1000; // 2 minutes
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Kellner Rufe</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Active Calls */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            Aktive Rufe ({activeCalls.length})
          </h2>
          
          <div className="space-y-4">
            <AnimatePresence>
              {activeCalls.map((call) => {
                const overdue = isOverdue(call.createdAt);
                return (
                  <motion.div 
                    key={call.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border p-6 rounded-2xl flex items-center justify-between transition-colors ${
                      overdue 
                        ? 'bg-red-900/40 border-red-500 animate-pulse' 
                        : 'bg-red-600/10 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        overdue ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500'
                      }`}>
                        <Bell size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${overdue ? 'text-red-500 dark:text-red-400' : 'text-red-500'}`}>Tisch {call.table}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(call.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-md ${
                            overdue ? 'bg-red-500/20 text-red-300' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                          }`}>
                            <Clock size={14} />
                            {formatWaitTime(call.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => resolveCall(call.id)}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      Erledigt
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {activeCalls.length === 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-gray-100 dark:border-white/5 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                <p>Keine aktiven Rufe.</p>
              </div>
            )}
          </div>
        </section>

        {/* Resolved Calls */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-gray-500 dark:text-gray-400">Kürzlich erledigt</h2>
          
          <div className="space-y-4">
            {resolvedCalls.map((call) => (
              <div 
                key={call.id}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-gray-500">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-300">Tisch {call.table}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(call.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {resolvedCalls.length === 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-gray-100 dark:border-white/5 text-center text-gray-500">
                <p>Keine erledigten Rufe.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
