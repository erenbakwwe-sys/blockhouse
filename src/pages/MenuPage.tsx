import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Bell, Plus, Minus, X, Heart, Clock, Mic, MicOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { MenuItem } from '../types';
import ThemeToggle from '../components/ThemeToggle';

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
  const navigate = useNavigate();
  
  const { menu, cart, addToCart, removeFromCart, addCall, settings } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('');
  
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
      toast('Sprachsteuerung deaktiviert', { icon: '🎤' });
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Sprachsteuerung aktiv. Sagen Sie "Kellner"');
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    if (!favorites.includes(id)) {
      toast.success('Zu Favoriten hinzugefügt', { icon: '❤️' });
    }
  };

  const categories = Array.from(new Set(menu.map(item => item.category)));
  
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleCallWaiter = () => {
    addCall(table);
    toast.success('Kellner wurde gerufen. Bitte warten Sie einen Moment.');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const filteredMenu = menu.filter(item => item.category === activeCategory);

  const openItemModal = (item: MenuItem) => {
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
      toast.success(`${itemQuantity}x ${selectedItem.name} hinzugefügt`);
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

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50 dark:bg-[#111]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-red-500 tracking-tight">BLOCK HOUSE</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tisch {table}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
              isListening 
                ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-[#333]'
            }`}
            title="Sprachsteuerung (Sag 'Kellner')"
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <ThemeToggle />
          <button 
            onClick={handleCallWaiter}
            className="flex items-center gap-2 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-gray-200 dark:border-white/5"
          >
            <Bell size={16} className="text-red-500" />
            Kellner rufen
          </button>
        </div>
      </header>

      {/* Estimated Time Banner */}
      {settings?.estimatedPrepTime > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-center gap-2 text-red-400 text-sm font-medium">
          <Clock size={16} />
          <span>Geschätzte Zeit: {settings.estimatedPrepTime}-{settings.estimatedPrepTime + 5} Min.</span>
        </div>
      )}

      {/* Categories */}
      <div className="sticky top-[73px] z-30 bg-gray-50 dark:bg-[#111] px-4 py-3 border-b border-gray-100 dark:border-white/5 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 dark:bg-[#222] text-gray-300 hover:bg-[#333]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {filteredMenu.map((item) => {
          const qtyInCart = getItemQuantityInCart(item.id);
          const isFavorite = favorites.includes(item.id);
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.2)]"
              onClick={() => openItemModal(item)}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-transparent group-hover:to-yellow-500/5 transition-colors duration-500 pointer-events-none z-10"></div>
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold z-20">
                  {formatCurrency(item.price)}
                </div>
                <button 
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute top-3 left-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20"
                >
                  <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1 relative z-20">
                <h3 className="text-lg font-bold mb-2 relative inline-block self-start">
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-500 group-hover:w-full"></span>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        {qtyInCart}
                      </div>
                      im Warenkorb
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm font-medium">
                      Anpassen & Hinzufügen
                    </div>
                  )}
                  <button 
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center hover:bg-red-600 transition-colors border border-gray-100 dark:border-white/5"
                  >
                    <Plus size={16} />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-48 sm:h-64 shrink-0">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                  <span className="text-xl font-bold text-red-500">{formatCurrency(selectedItem.price)}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{selectedItem.description}</p>

                <div className="space-y-6">
                  {/* Options */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Optionen (Optional)</h3>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_OPTIONS.map(option => (
                        <button
                          key={option}
                          onClick={() => toggleOption(option)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                            itemOptions.includes(option)
                              ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : 'bg-gray-100 dark:bg-[#222] border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-[#333]'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Ihre Anmerkung</h3>
                    <textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="Z.B.: Ich habe eine Allergie, bitte beachten Sie..."
                      className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none h-24"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-[#222] p-2 rounded-2xl border border-gray-100 dark:border-white/5">
                    <button 
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="w-12 h-12 rounded-xl bg-[#333] flex items-center justify-center hover:bg-[#444] transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{itemQuantity}</span>
                    <button 
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="w-12 h-12 rounded-xl bg-[#333] flex items-center justify-center hover:bg-[#444] transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] shrink-0">
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isAdding 
                      ? 'bg-green-500 text-white scale-95' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isAdding ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 size={24} className="animate-bounce" />
                      Hinzugefügt!
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      {itemQuantity}x Hinzufügen - {formatCurrency(selectedItem.price * itemQuantity)}
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
            className="w-full max-w-md bg-red-600 text-white p-4 rounded-2xl font-bold shadow-[0_10px_30px_rgba(220,38,38,0.3)] flex items-center justify-between hover:bg-red-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                {cartItemCount}
              </div>
              <span>Warenkorb ansehen</span>
            </div>
            <span>{formatCurrency(cartTotal)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
