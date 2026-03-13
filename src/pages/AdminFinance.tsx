import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, FileText, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function AdminFinance() {
  const { orders, expenses, addExpense, deleteExpense } = useStore();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  
  const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const netProfit = todayRevenue - totalExpenses;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    addExpense({
      description,
      amount: parseFloat(amount)
    });
    
    setDescription('');
    setAmount('');
    toast.success('Ausgabe hinzugefügt');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('de-DE');
    
    doc.setFontSize(20);
    doc.text(`Tagesbericht - ${dateStr}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Gesamtumsatz: ${formatCurrency(todayRevenue)}`, 14, 32);
    doc.text(`Gesamtausgaben: ${formatCurrency(totalExpenses)}`, 14, 40);
    doc.text(`Nettogewinn: ${formatCurrency(netProfit)}`, 14, 48);

    doc.setFontSize(16);
    doc.text('Verkäufe', 14, 60);
    
    const salesData = todayOrders.map(o => [
      new Date(o.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      `Tisch ${o.table}`,
      o.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      formatCurrency(o.total)
    ]);

    (doc as any).autoTable({
      startY: 65,
      head: [['Zeit', 'Tisch', 'Artikel', 'Betrag']],
      body: salesData,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 65;

    doc.setFontSize(16);
    doc.text('Ausgaben', 14, finalY + 15);

    const expensesData = todayExpenses.map(e => [
      new Date(e.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      e.description,
      formatCurrency(e.amount)
    ]);

    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Zeit', 'Beschreibung', 'Betrag']],
      body: expensesData,
    });

    doc.save(`Tagesbericht_${dateStr}.pdf`);
    toast.success('PDF exportiert');
  };

  const exportExcel = () => {
    const dateStr = new Date().toLocaleDateString('de-DE');
    
    // Summary Sheet
    const summaryData = [
      ['Tagesbericht', dateStr],
      [''],
      ['Gesamtumsatz', todayRevenue],
      ['Gesamtausgaben', totalExpenses],
      ['Nettogewinn', netProfit]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Sales Sheet
    const salesData = todayOrders.map(o => ({
      Zeit: new Date(o.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      Tisch: `Tisch ${o.table}`,
      Artikel: o.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      Betrag: o.total
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesData);

    // Expenses Sheet
    const expensesData = todayExpenses.map(e => ({
      Zeit: new Date(e.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      Beschreibung: e.description,
      Betrag: e.amount
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Zusammenfassung');
    XLSX.utils.book_append_sheet(wb, wsSales, 'Verkäufe');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Ausgaben');

    XLSX.writeFile(wb, `Tagesbericht_${dateStr}.xlsx`);
    toast.success('Excel exportiert');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Finanzen & Berichte</h1>
        <div className="flex gap-4">
          <button 
            onClick={exportPDF}
            className="bg-red-600/20 text-red-500 hover:bg-red-600/30 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <FileText size={20} />
            PDF Export
          </button>
          <button 
            onClick={exportExcel}
            className="bg-green-600/20 text-green-500 hover:bg-green-600/30 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Download size={20} />
            Excel Export
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Umsatz Heute</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(todayRevenue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <TrendingDown className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ausgaben Heute</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <DollarSign className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nettogewinn</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 p-6 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-6">Ausgabe hinzufügen</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Beschreibung</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                placeholder="z.B. Fleisch, Gemüse, Getränke"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Betrag (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Hinzufügen
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-xl font-bold">Heutige Ausgaben</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Zeit</th>
                  <th className="px-6 py-4 font-medium">Beschreibung</th>
                  <th className="px-6 py-4 font-medium">Betrag</th>
                  <th className="px-6 py-4 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-100 dark:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(expense.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium">{expense.description}</td>
                    <td className="px-6 py-4 text-red-500 font-medium">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {todayExpenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Keine Ausgaben für heute erfasst.
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
