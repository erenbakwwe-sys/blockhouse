import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { DollarSign, ShoppingBag, Clock, Users, TrendingUp, Award, Printer } from 'lucide-react';
import { OrderStatus, Order } from '../types';
import toast from 'react-hot-toast';
import { printThermalReceipt } from '../lib/printReceipt';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { orders, calls, updateOrderStatus } = useStore();

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== 'served').length;
  const activeCalls = calls.filter(c => c.status === 'active').length;

  // Calculate last 7 days data
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' });
    const dateStr = d.toDateString();
    
    // Filter orders by date string
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dateStr);
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const count = dayOrders.length;
    
    return {
      name: dayName,
      revenue: parseFloat(revenue.toFixed(2)),
      count: count
    };
  });

  // Custom Tooltip for Recharts area chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 dark:bg-black/95 text-white p-3.5 rounded-xl border border-white/10 shadow-xl backdrop-blur-md text-xs">
          <p className="font-bold mb-1 text-gray-300">{payload[0].payload.name}</p>
          <p className="text-emerald-400 font-bold mb-0.5">Umsatz: {formatCurrency(payload[0].value)}</p>
          <p className="text-gray-400 font-medium">Bestellungen: {payload[0].payload.count}</p>
        </div>
      );
    }
    return null;
  };

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

  const printOrder = (order: Order) => {
    try {
      printThermalReceipt({
        id: order.id,
        table: order.table,
        createdAt: order.createdAt,
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          options: i.options,
          notes: i.notes
        })),
        subtotal: order.total, // Order records total directly
        total: order.total,
        paymentMethod: order.paymentMethod || order.paymentType
      });
      toast.success('Druckerdialog geöffnet!');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Fehler beim Öffnen des Druckerdialogs.');
    }
  };

  return (
    <div className="p-4 md:p-8">
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
        {/* Visual Analytics */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 p-6 lg:col-span-2 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <TrendingUp className="text-indigo-500" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Umsatz-Analyse</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Umsatzverlauf der letzten 7 Tage</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-gray-400 block">Gesamt (7 Tage)</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(last7DaysData.reduce((sum, d) => sum + d.revenue, 0))}
                </span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#888888', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#888888', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => `${val}€`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Widget */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 p-6 lg:col-span-1 shadow-sm">
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
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden w-full mb-8 shadow-sm">
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
                    <div className="flex items-center gap-2">
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
                      <button 
                        onClick={() => printOrder(order)}
                        className="p-1.5 bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
                        title="Bon drucken"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
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
  );
}
