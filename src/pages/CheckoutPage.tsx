import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, Banknote, Trash2, Plus, Minus, X, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { OrderItem } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import { TRANSLATIONS } from '../lib/translations';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table') || '1';
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { menu, cart, addToCart, removeFromCart, clearCart, addOrder, language, tables } = useStore();
  const t = TRANSLATIONS[language];
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'pos'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipPercentage, setTipPercentage] = useState<number>(0);

  // Verify token
  const [isValidTable, setIsValidTable] = useState<boolean | null>(null);

  useEffect(() => {
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

  const cartItems = cart;
  const subTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const tipAmount = subTotal * tipPercentage;
  const cartTotal = subTotal + tipAmount;

  // Find an upsell item (e.g., a drink or dessert not in cart)
  const upsellItem = menu.find(item => 
    (item.category.toLowerCase().includes('getränk') || item.category.toLowerCase().includes('dessert') || item.category.toLowerCase().includes('drink')) && 
    !cartItems.some(cartItem => cartItem.menuItemId === item.id)
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error(t.emptyCart);
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
        paymentMethod,
        paymentType: paymentMethod,
      };
      
      addOrder(newOrder);
      clearCart();
      setIsSubmitting(false);
      toast.success(t.orderSuccess);
      navigate(`/order-status?table=${table}`);
    }, 1500);
  };

  if (isValidTable === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-white/5">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t.invalidQR.split('.')[0]}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t.invalidQR}
          </p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t.emptyCart}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">{t.emptyCartDesc}</p>
        <button 
          onClick={() => navigate(`/menu?table=${table}`)}
          className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          {t.backToMenu}
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black pb-32 selection:bg-[#007aff]/20 antialiased tracking-tight">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={18} className="text-[#1c1c1e] dark:text-white" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#1c1c1e] dark:text-white">{t.checkout}</h1>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tisch {table}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Order Items */}
        <section>
          <h2 className="text-xs font-bold mb-2.5 text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">{t.yourOrder}</h2>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[20px] border border-black/5 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-[#ff3b30] font-semibold">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 rounded-full p-1">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-full bg-white dark:bg-[#2c2c2e] text-[#1c1c1e] dark:text-white flex items-center justify-center hover:opacity-85 transition-opacity shadow-sm"
                    >
                      {item.quantity === 1 ? <Trash2 size={12} className="text-[#ff3b30]" /> : <Minus size={12} />}
                    </button>
                    <span className="font-bold text-xs text-center w-3 text-gray-950 dark:text-white">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart({ ...item, quantity: 1 })}
                      className="w-7 h-7 rounded-full bg-[#007aff] dark:bg-[#0a84ff] text-white flex items-center justify-center hover:opacity-85 transition-opacity shadow-sm"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                
                {/* Options and Notes */}
                {(item.options?.length > 0 || item.notes) && (
                  <div className="pt-2 border-t border-black/[0.03] dark:border-white/[0.03] text-xs">
                    {item.options?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {item.options.map(opt => (
                          <span key={opt} className="bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-[6px] text-[10px] font-semibold">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-gray-500 dark:text-gray-400 italic text-[11px]">"{item.notes}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Upsell Section */}
        {upsellItem && (
          <section className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-[20px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={upsellItem.image} alt={upsellItem.name} className="w-14 h-14 rounded-xl object-cover border border-black/5" />
              <div>
                <span className="text-[10px] font-bold text-[#007aff] dark:text-[#0a84ff] uppercase tracking-wider block mb-0.5">✨ {t.weRecommend}</span>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{upsellItem.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatCurrency(upsellItem.price)}</p>
              </div>
            </div>
            <button 
              onClick={() => addToCart({
                menuItemId: upsellItem.id,
                name: upsellItem.name,
                price: upsellItem.price,
                quantity: 1,
                notes: '',
                options: []
              })}
              className="bg-[#007aff] hover:opacity-90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0 self-stretch md:self-auto flex items-center justify-center"
            >
              {t.addToCart}
            </button>
          </section>
        )}

        {/* Tip Section */}
        <section>
          <h2 className="text-xs font-bold mb-2.5 text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">{t.tip}</h2>
          <div className="bg-black/5 dark:bg-white/10 p-[3px] rounded-[12px] flex gap-1">
            {[0, 0.1, 0.15, 0.2].map((percentage) => (
              <button
                key={percentage}
                onClick={() => setTipPercentage(percentage)}
                className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-all ${
                  tipPercentage === percentage
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1c1c1e] dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {percentage === 0 ? t.noTip : `${percentage * 100}%`}
              </button>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="text-xs font-bold mb-2.5 text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">{t.paymentMethod}</h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-[18px] border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'card' 
                  ? 'bg-white dark:bg-[#1c1c1e] border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-semibold' 
                  : 'bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400'
              }`}
            >
              <CreditCard size={20} className={paymentMethod === 'card' ? 'text-[#007aff] dark:text-[#0a84ff]' : ''} />
              <span className="text-[11px] text-center line-clamp-1">{t.card}</span>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-[18px] border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'cash' 
                  ? 'bg-white dark:bg-[#1c1c1e] border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-semibold' 
                  : 'bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Banknote size={20} className={paymentMethod === 'cash' ? 'text-[#007aff] dark:text-[#0a84ff]' : ''} />
              <span className="text-[11px] text-center line-clamp-1">{t.cash}</span>
            </button>
            <button
              onClick={() => setPaymentMethod('pos')}
              className={`p-3 rounded-[18px] border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'pos' 
                  ? 'bg-white dark:bg-[#1c1c1e] border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-semibold' 
                  : 'bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Smartphone size={20} className={paymentMethod === 'pos' ? 'text-[#007aff] dark:text-[#0a84ff]' : ''} />
              <span className="text-[11px] text-center line-clamp-1">{t.pos}</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3 bg-white dark:bg-[#1c1c1e] p-5 rounded-[20px] border border-black/5 dark:border-white/10"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Karteninhaber</label>
                <input type="text" placeholder="Max Mustermann" className="w-full bg-black/5 dark:bg-white/10 border border-transparent rounded-[10px] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#007aff] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kartennummer</label>
                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-black/5 dark:bg-white/10 border border-transparent rounded-[10px] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#007aff] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Gültig bis</label>
                  <input type="text" placeholder="MM/YY" className="w-full bg-black/5 dark:bg-white/10 border border-transparent rounded-[10px] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#007aff] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">CVC</label>
                  <input type="text" placeholder="123" className="w-full bg-black/5 dark:bg-white/10 border border-transparent rounded-[10px] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#007aff] transition-colors" />
                </div>
              </div>
            </motion.div>
          )}

          {paymentMethod === 'pos' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white dark:bg-[#1c1c1e] p-5 rounded-[20px] border border-black/5 dark:border-white/10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#007aff]/10 dark:bg-[#0a84ff]/10 flex items-center justify-center mx-auto mb-3">
                <Smartphone size={22} className="text-[#007aff] dark:text-[#0a84ff]" />
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {language === 'de' ? 'Das mobile Kartengerät wird an Ihren Tisch gebracht.' :
                 language === 'tr' ? 'Mobil POS cihazı masanıza getirilecektir.' :
                 'The mobile card terminal will be brought to your table.'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {language === 'de' ? 'Unterstützt alle gängigen Debit-/Kreditkarten, Apple Pay & Google Pay.' :
                 language === 'tr' ? 'Tüm banka/kredi kartları, Apple Pay ve Google Pay desteklenmektedir.' :
                 'Supports all major debit/credit cards, Apple Pay & Google Pay.'}
              </p>
            </motion.div>
          )}
        </section>

        {/* Summary */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[20px] border border-black/5 dark:border-white/10">
          <div className="flex justify-between mb-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <span>{t.subtotal}</span>
            <span>{formatCurrency(subTotal)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between mb-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <span>{t.tip}</span>
              <span>{formatCurrency(tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between mb-3.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <span>Service</span>
            <span>Inklusive</span>
          </div>
          <div className="flex justify-between items-center pt-3.5 border-t border-black/5 dark:border-white/5">
            <span className="text-sm font-extrabold">{t.total}</span>
            <span className="text-xl font-extrabold text-[#ff3b30]">{formatCurrency(cartTotal)}</span>
          </div>
        </section>
      </main>

      {/* Sticky Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/50 dark:bg-black/50 backdrop-blur-md border-t border-black/5 dark:border-white/5 z-50 flex justify-center">
        <button 
          onClick={handleCheckout}
          disabled={isSubmitting}
          className="w-full max-w-2xl bg-[#007aff] dark:bg-[#0a84ff] text-white py-3.5 rounded-[14px] font-black shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{t.orderNow}</span>
              <span>•</span>
              <span>{formatCurrency(cartTotal)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
