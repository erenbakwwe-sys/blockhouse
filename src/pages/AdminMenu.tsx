import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';
import { MenuItem } from '../types';

export default function AdminMenu() {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: ''
  });

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', price: '', description: '', image: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMenuItem(id);
    setDeleteConfirmId(null);
    toast.success('Gericht erfolgreich gelöscht');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
    };

    if (editingItem) {
      updateMenuItem(editingItem.id, itemData);
      toast.success('Gericht aktualisiert');
    } else {
      addMenuItem(itemData);
      toast.success('Gericht hinzugefügt');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Menü Verwaltung</h1>
        <button 
          onClick={handleOpenAdd}
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Gericht hinzufügen
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Bild</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Kategorie</th>
                <th className="px-6 py-4 font-medium">Preis</th>
                <th className="px-6 py-4 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMenu.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100 dark:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  </td>
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="px-6 py-4 font-medium text-red-500">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-4 text-right">
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Sicher?</span>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                        >
                          Ja, löschen
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="bg-gray-200 dark:bg-[#333] text-gray-900 dark:text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-[#444]"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredMenu.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Keine Gerichte gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-bold">{editingItem ? 'Gericht bearbeiten' : 'Neues Gericht'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Kategorie</label>
                  <input 
                    required
                    type="text" 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preis (€)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Beschreibung</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bild URL</label>
                <input 
                  type="url" 
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
