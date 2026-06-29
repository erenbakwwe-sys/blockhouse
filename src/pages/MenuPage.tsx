import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Bell, Plus, Minus, X, Heart, Clock, Mic, MicOff, CheckCircle2, Globe, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { MenuItem } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import { TRANSLATIONS, Language } from '../lib/translations';

const COMMON_OPTIONS = [
  "Ohne Zwiebeln",
  "Extra scharf",
  "Wenig Soße",
  "Viel Soße",
  "Extra Brot"
];

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table') || '1';
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const { menu, cart, addToCart, removeFromCart, addCall, settings, tables, language, setLanguage } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const t = TRANSLATIONS[language];
  
  // Verify token
  const [isValidTable, setIsValidTable] = useState<boolean | null>(null);

  useEffect(() => {
    if (tables.length > 0) {
      const tableData = tables.find(t => t.number === table);
      if (tableData) {
        // If the table has a token, it must match. If it doesn't have a token, it's valid (for backwards compatibility)
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

  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemOptions, setItemOptions] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Voice Command State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Add to Cart Animation State
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim().toLowerCase();
        
        if (command.includes('kellner') || command.includes('garson') || command.includes('waiter')) {
          handleCallWaiter();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error(e);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Remove isListening from dependencies to avoid recreating

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error(e);
          }
        }
      };
    }
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Spracherkennung wird von Ihrem Browser nicht unterstützt.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast(t.voiceInactive, { icon: '🎤' });
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success(t.voiceActive);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    if (!favorites.includes(id)) {
      toast.success(t.favoritesAdded, { icon: '❤️' });
    } else {
      toast(t.favoritesRemoved, { icon: '💔' });
    }
  };

  const categories = Array.from(new Set(menu.map(item => item.category)));
  
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleCallWaiter = () => {
    if (!isValidTable) {
      toast.error(t.invalidQR);
      return;
    }
    addCall(table);
    toast.success(t.waiterCalled);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const filteredMenu = menu.filter(item => item.category === activeCategory);

  const openItemModal = (item: MenuItem) => {
    if (!isValidTable) {
      toast.error(t.invalidQR);
      return;
    }
    setSelectedItem(item);
    setItemNotes('');
    setItemOptions([]);
    setItemQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    
    setIsAdding(true);
    
    setTimeout(() => {
      addToCart({
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: itemQuantity,
        notes: itemNotes,
        options: itemOptions
      });
      
      setIsAdding(false);
      setSelectedItem(null);
      toast.success(t.addedToCart);
    }, 800);
  };

  const toggleOption = (option: string) => {
    setItemOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  // Get quantity of a specific menu item in cart (regardless of options)
  const getItemQuantityInCart = (menuItemId: string) => {
    return cart.filter(item => item.menuItemId === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
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

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} className="text-[#1c1c1e] dark:text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-gray-950 dark:text-white">BLOCK HOUSE</h1>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tisch {table}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-black/5 dark:bg-white/10 border-none rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-0 text-gray-900 dark:text-white"
          >
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="tr">TR</option>
          </select>
          <button
            onClick={toggleListening}
            className={`h-9 px-3 rounded-full flex items-center justify-center gap-2 transition-all border ${
              isListening 
                ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-transparent hover:bg-black/10 dark:hover:bg-white/15'
            }`}
            title={t.voiceCommand}
          >
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
            <span className="text-[11px] font-bold hidden sm:block">{t.voiceCommandHint}</span>
          </button>
          <ThemeToggle />
          <button 
            onClick={handleCallWaiter}
            className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#1c1c1e] dark:text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          >
            <Bell size={14} className="text-red-500" />
            {t.callWaiter}
          </button>
        </div>
      </header>

      {/* Estimated Time Banner */}
      {settings?.estimatedPrepTime > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-center gap-2 text-red-400 text-sm font-medium"
        >
          <Clock size={16} />
          <span>{t.estimatedTime(settings.estimatedPrepTime, settings.estimatedPrepTime + 5)}</span>
        </motion.div>
      )}

      {/* Categories */}
      <div className="sticky top-[61px] z-30 bg-white/70 dark:bg-black/70 backdrop-blur-xl px-4 py-2.5 border-b border-black/5 dark:border-white/10 overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === category 
                  ? 'bg-[#007aff] dark:bg-[#0a84ff] text-white shadow-sm' 
                  : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="p-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {filteredMenu.map((item) => {
          const qtyInCart = getItemQuantityInCart(item.id);
          const isFavorite = favorites.includes(item.id);
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-[#1c1c1e] rounded-[20px] overflow-hidden border border-black/5 dark:border-white/5 flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={() => openItemModal(item)}
            >
              <div className="h-44 overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-[10px] text-xs font-bold text-white z-20">
                  {formatCurrency(item.price)}
                </div>
                <button 
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute top-3 left-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20"
                >
                  <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>
              <div className="p-4 flex flex-col flex-1 relative z-20">
                <h3 className="text-base font-bold mb-1 text-gray-900 dark:text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex-1 line-clamp-2 leading-relaxed">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/5 dark:border-white/5">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <div className="w-5 h-5 rounded-full bg-[#007aff]/10 dark:bg-[#0a84ff]/20 flex items-center justify-center text-[10px]">
                        {qtyInCart}
                      </div>
                      {t.inCart}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs font-semibold">
                      {t.customizeAndAdd}
                    </div>
                  )}
                  <button 
                    className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-[#007aff] hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Item Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg sm:rounded-[24px] rounded-t-[24px] overflow-hidden flex flex-col max-h-[85vh] border border-black/5 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Apple Pull Handle on Mobile */}
              <div className="sm:hidden block shrink-0">
                <div className="ios-sheet-handle" />
              </div>

              <div className="relative h-44 sm:h-52 shrink-0">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 hide-scrollbar">
                <div className="flex justify-between items-start mb-1.5">
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedItem.name}</h2>
                  <span className="text-lg font-bold text-[#ff3b30]">{formatCurrency(selectedItem.price)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">{selectedItem.description}</p>
 
                <div className="space-y-5">
                  {/* Options */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">{t.options}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_OPTIONS.map(option => (
                        <button
                          key={option}
                          onClick={() => toggleOption(option)}
                          className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all border ${
                            itemOptions.includes(option)
                              ? 'bg-[#007aff]/10 border-[#007aff]/30 text-[#007aff] dark:text-[#0a84ff]'
                              : 'bg-black/5 dark:bg-white/10 border-transparent text-gray-600 dark:text-gray-300 hover:bg-black/10'
                          }`}
                        >
                          {t.commonOptions[option as keyof typeof t.commonOptions] || option}
                        </button>
                      ))}
                    </div>
                  </div>
 
                  {/* Notes */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">{t.notes}</h3>
                    <textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder={t.notesPlaceholder}
                      className="w-full bg-black/5 dark:bg-white/10 border border-transparent dark:border-white/5 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#007aff] transition-colors resize-none h-20"
                    />
                  </div>
 
                  {/* Quantity */}
                  <div className="flex items-center justify-between bg-black/5 dark:bg-white/10 p-1.5 rounded-xl">
                    <button 
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-[#2c2c2e] text-gray-800 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors shadow-sm"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-base font-bold w-12 text-center text-gray-900 dark:text-white">{itemQuantity}</span>
                    <button 
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-[#2c2c2e] text-gray-800 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors shadow-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
 
              <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#1c1c1e]/50 backdrop-blur-md shrink-0">
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`w-full py-3.5 rounded-[14px] font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isAdding 
                      ? 'bg-[#34c759] text-white' 
                      : 'bg-[#007aff] dark:bg-[#0a84ff] hover:opacity-90 text-white shadow-sm'
                  }`}
                >
                  {isAdding ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      {t.addedToCart}
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      {itemQuantity}x {t.addToCart} • {formatCurrency(selectedItem.price * itemQuantity)}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Sticky Cart Button */}
      {cartItemCount > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center"
        >
          <button 
            onClick={() => navigate(`/checkout?table=${table}`)}
            className="w-full max-w-md bg-[#007aff] dark:bg-[#0a84ff] text-white p-4 rounded-[16px] font-extrabold shadow-lg flex items-center justify-between hover:opacity-90 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                {cartItemCount}
              </div>
              <span className="text-sm tracking-tight">{t.viewCart}</span>
            </div>
            <span className="text-sm font-black">{formatCurrency(cartTotal)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
