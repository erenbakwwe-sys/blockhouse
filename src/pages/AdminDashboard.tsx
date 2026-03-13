import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { DollarSign, ShoppingBag, Clock, Users, TrendingUp, Award } from 'lucide-react';
import { OrderStatus } from '../types';

export default function AdminDashboard() {
  const { orders, calls, updateOrderStatus } = useStore();

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== 'served').length;
  const activeCalls = calls.filter(c => c.status === 'active').length;

  // Calculate top selling products
  const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.menuItemId]) {
        productSales[item.menuItemId] = { name: item.name, count: 0, revenue: 0 };
      }
      productSales[item.menuItemId].count += item.quantity;
      productSales[item.menuItemId].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Estimate customer count (unique tables today, or just order count if tables reuse)
  const todayCustomers = new Set(todayOrders.map(o => o.table)).size;

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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <DollarSign className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Umsatz Heute</p>
            <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShoppingBag className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bestellungen Heute</p>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kunden Heute</p>
            <p className="text-2xl font-bold">{todayCustomers}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Clock className="text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Offene Bestellungen</p>
            <p className="text-2xl font-bold">{pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Users className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aktive Rufe</p>
            <p className="text-2xl font-bold">{activeCalls}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top Products Widget */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 p-6 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="text-orange-500" size={20} />
            </div>
            <h2 className="text-xl font-bold">Top 3 Produkte</h2>
          </div>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-sm text-gray-700 dark:text-gray-300">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.count}x verkauft</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Noch keine Verkäufe</p>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden lg:col-span-2">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-xl font-bold">Letzte Bestellungen</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Tisch</th>
                <th className="px-6 py-4 font-medium">Betrag</th>
                <th className="px-6 py-4 font-medium">Artikel</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Zeit</th>
                <th className="px-6 py-4 font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-100 dark:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">Tisch {order.table}</td>
                  <td className="px-6 py-4 text-red-500 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(order.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="received">Erhalten</option>
                      <option value="preparing">In Zubereitung</option>
                      <option value="ready">Fertig</option>
                      <option value="served">Serviert</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Keine Bestellungen vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
