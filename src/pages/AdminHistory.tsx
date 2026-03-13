import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { History, Receipt, Bell, CheckCircle2, Trash2, X } from 'lucide-react';
import { OrderStatus } from '../types';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminHistory() {
  const { orders, calls, clearHistory } = useStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const sortedOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  const sortedCalls = [...calls].sort((a, b) => b.createdAt - a.createdAt);

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirmModal(false);
    toast.success('Verlauf wurde gelöscht');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'bg-yellow-500/20 text-yellow-500';
      case 'preparing': return 'bg-blue-500/20 text-blue-500';
      case 'ready': return 'bg-green-500/20 text-green-500';
      case 'served': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'Erhalten';
      case 'preparing': return 'In Zubereitung';
      case 'ready': return 'Fertig';
      case 'served': return 'Serviert';
      default: return status;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="text-red-500" /> Verlauf
        </h1>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-colors"
        >
          <Trash2 size={18} />
          Verlauf löschen
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Verlauf löschen</h2>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                Möchten Sie den Verlauf wirklich löschen? Abgeschlossene Bestellungen und erledigte Rufe werden dauerhaft entfernt. 
                <br/><br/>
                <span className="text-yellow-500 font-medium">Aktive Bestellungen und Rufe bleiben erhalten.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Orders History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold">Bestellverlauf</h2>
          </div>
          
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Zeit</th>
                    <th className="px-6 py-4 font-medium">Tisch</th>
                    <th className="px-6 py-4 font-medium">Artikel</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-100 dark:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleString('de-DE', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium">Tisch {order.table}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {order.items.map(i => (
                            <div key={i.id}>
                              <span className="text-gray-200">{i.quantity}x {i.name}</span>
                              {(i.options?.length > 0 || i.notes) && (
                                <div className="text-xs text-gray-500 ml-4">
                                  {i.options?.length > 0 && <span>[{i.options.join(', ')}] </span>}
                                  {i.notes && <span className="italic">"{i.notes}"</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-red-500 font-medium text-right">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                  {sortedOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Keine Bestellungen im Verlauf.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calls History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold">Kellner-Rufe</h2>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {sortedCalls.map((call) => (
                <div key={call.id} className="p-4 flex items-center justify-between hover:bg-gray-100 dark:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold text-gray-200">Tisch {call.table}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(call.createdAt).toLocaleString('de-DE', { 
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div>
                    {call.status === 'active' ? (
                      <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold animate-pulse">
                        Aktiv
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs font-bold">
                        <CheckCircle2 size={14} /> Erledigt
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {sortedCalls.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Keine Rufe im Verlauf.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
