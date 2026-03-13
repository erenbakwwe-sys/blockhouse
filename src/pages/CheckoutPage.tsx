import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, Banknote, Trash2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { OrderItem } from '../types';
import ThemeToggle from '../components/ThemeToggle';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table') || '1';
  const navigate = useNavigate();
  const { menu, cart, addToCart, removeFromCart, clearCart, addOrder } = useStore();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = cart;
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Ihr Warenkorb ist leer.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      const newOrder = {
        table,
        items: cartItems,
        total: cartTotal,
        status: 'received' as const,
      };
      
      addOrder(newOrder);
      clearCart();
      setIsSubmitting(false);
      toast.success('Bestellung erfolgreich aufgegeben!');
      navigate(`/order-status?table=${table}`);
    }, 1500);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Warenkorb ist leer</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Bitte fügen Sie Gerichte aus dem Menü hinzu.</p>
        <button 
          onClick={() => navigate(`/menu?table=${table}`)}
          className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          Zurück zum Menü
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50 dark:bg-[#111]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kasse</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tisch {table}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-8">
        {/* Order Items */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-gray-300">Ihre Bestellung</h2>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-red-500 font-medium">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#222] rounded-full p-1">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center hover:bg-[#444] transition-colors"
                    >
                      {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                    </button>
                    <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart({ ...item, quantity: 1 })}
                      className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Options and Notes */}
                {(item.options?.length > 0 || item.notes) && (
                  <div className="pt-3 border-t border-gray-100 dark:border-white/5 text-sm">
                    {item.options?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.options.map(opt => (
                          <span key={opt} className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 px-2 py-1 rounded-md text-xs">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-gray-500 dark:text-gray-400 italic">"{item.notes}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-gray-300">Zahlungsmethode</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors ${
                paymentMethod === 'card' 
                  ? 'bg-red-600/10 border-red-600 text-gray-900 dark:text-white' 
                  : 'bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#222]'
              }`}
            >
              <CreditCard size={24} className={paymentMethod === 'card' ? 'text-red-500' : ''} />
              <span className="font-medium">Karte</span>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors ${
                paymentMethod === 'cash' 
                  ? 'bg-red-600/10 border-red-600 text-gray-900 dark:text-white' 
                  : 'bg-white dark:bg-[#1a1a1a] border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#222]'
              }`}
            >
              <Banknote size={24} className={paymentMethod === 'cash' ? 'text-red-500' : ''} />
              <span className="font-medium">Bar beim Kellner</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 space-y-4 bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Karteninhaber</label>
                <input type="text" placeholder="Max Mustermann" className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Kartennummer</label>
                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Gültig bis</label>
                  <input type="text" placeholder="MM/YY" className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CVC</label>
                  <input type="text" placeholder="123" className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Summary */}
        <section className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="flex justify-between mb-2 text-gray-500 dark:text-gray-400">
            <span>Zwischensumme</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div className="flex justify-between mb-4 text-gray-500 dark:text-gray-400">
            <span>Service</span>
            <span>Inklusive</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10">
            <span className="text-lg font-bold">Gesamtsumme</span>
            <span className="text-2xl font-bold text-red-500">{formatCurrency(cartTotal)}</span>
          </div>
        </section>
      </main>

      {/* Sticky Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#111] via-[#111] to-transparent z-50">
        <button 
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="w-full max-w-2xl mx-auto bg-red-600 text-white p-4 rounded-2xl font-bold shadow-[0_10px_30px_rgba(220,38,38,0.3)] flex items-center justify-center gap-3 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Jetzt kostenpflichtig bestellen</span>
              <span>•</span>
              <span>{formatCurrency(cartTotal)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
