import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Plus, Trash2, Calendar, Users, CheckCircle, ChevronDown } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import toast from 'react-hot-toast';
import { doc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_LABELS = {
  de: {
    available: 'Frei',
    occupied: 'Besetzt',
    reserved: 'Reserviert',
    setStatus: 'Status ändern',
  },
  en: {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    setStatus: 'Change Status',
  },
  tr: {
    available: 'Boş',
    occupied: 'Dolu',
    reserved: 'Rezerve',
    setStatus: 'Durumu Değiştir',
  },
};

export default function AdminTables() {
  const { tables, addTable, updateTableStatus, orders, language } = useStore();
  const [tableCount, setTableCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [posTabs, setPosTabs] = useState<any[]>([]);
  const [activeMenuTableId, setActiveMenuTableId] = useState<string | null>(null);

  const t = STATUS_LABELS[language as keyof typeof STATUS_LABELS] || STATUS_LABELS.de;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tabs'), (snapshot) => {
      const fetchedTabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosTabs(fetchedTabs);
    }, console.error);
    return () => unsub();
  }, []);

  const getTableStatus = (tableNum: string, manualStatus?: 'available' | 'occupied' | 'reserved') => {
    // 1. Check if there is an active POS tab with items
    const hasActivePOS = posTabs.some(t => t.table === tableNum && t.active && t.items && t.items.length > 0);
    
    // 2. Check if there are active orders from customers
    const hasActiveOrder = orders.some(o => o.table === tableNum && ['received', 'preparing', 'ready', 'served'].includes(o.status));
    
    if (hasActivePOS || hasActiveOrder) {
      return 'occupied';
    }
    
    if (manualStatus) {
      return manualStatus;
    }
    
    return 'available';
  };

  const handleGenerateTables = async () => {
    const count = parseInt(tableCount);
    if (isNaN(count) || count <= 0) {
      toast.error('Bitte geben Sie eine gültige Anzahl ein.');
      return;
    }

    setIsGenerating(true);
    try {
      // Create tables
      for (let i = 1; i <= count; i++) {
        // Check if table already exists to avoid duplicates
        if (!tables.some(t => t.number === i.toString())) {
          // Generate a random token for security
          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          await addTable({ number: i.toString(), token });
        }
      }
      toast.success(`${count} Tische erfolgreich generiert!`);
      setTableCount('');
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Generieren der Tische.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (window.confirm('Möchten Sie diesen Tisch wirklich löschen?')) {
      try {
        await deleteDoc(doc(db, 'tables', id));
        toast.success('Tisch gelöscht');
      } catch (error) {
        console.error(error);
        toast.error('Fehler beim Löschen');
      }
    }
  };

  const getTableUrl = (tableNum: string, token?: string) => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/menu?table=${tableNum}`;
    if (token) {
      url += `&token=${token}`;
    }
    return url;
  };

  const handlePrint = (tableNum: string, token?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const url = getTableUrl(tableNum, token);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Tisch ${tableNum}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            h1 { color: #dc2626; margin-bottom: 2rem; }
            .qr-container { padding: 2rem; border: 2px solid #000; border-radius: 1rem; }
            p { margin-top: 2rem; font-size: 1.5rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>BLOCK HOUSE</h1>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" alt="QR Code" />
          </div>
          <p>Tisch ${tableNum}</p>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">QR Tisch Manager</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Anzahl Tische:</span>
            <input 
              type="number" 
              min="1"
              placeholder="z.B. 50" 
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 w-24"
            />
          </div>
          <button 
            onClick={handleGenerateTables}
            disabled={isGenerating}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={20} />
            {isGenerating ? 'Generiere...' : 'Tische generieren'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.sort((a, b) => parseInt(a.number) - parseInt(b.number)).map(table => {
          const url = getTableUrl(table.number, table.token);
          const currentStatus = getTableStatus(table.number, table.status);
          
          let statusStyles = '';
          let dotColor = '';
          
          if (currentStatus === 'occupied') {
            statusStyles = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
            dotColor = 'bg-rose-500';
          } else if (currentStatus === 'reserved') {
            statusStyles = 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
            dotColor = 'bg-amber-500';
          } else {
            statusStyles = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
            dotColor = 'bg-emerald-500';
          }

          return (
            <div key={table.id} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center relative">
              {/* Status Picker Pill */}
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={() => setActiveMenuTableId(activeMenuTableId === table.id ? null : table.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-sm uppercase tracking-wider ${statusStyles}`}
                >
                  {currentStatus === 'occupied' && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                  )}
                  {currentStatus !== 'occupied' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  )}
                  <span>{t[currentStatus]}</span>
                  <ChevronDown size={10} className="opacity-60" />
                </button>
                
                {activeMenuTableId === table.id && (
                  <>
                    <div className="fixed inset-0 z-15 cursor-default" onClick={() => setActiveMenuTableId(null)} />
                    <div className="absolute left-0 mt-1.5 w-36 bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl py-1.5 text-left z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          updateTableStatus(table.id, 'available');
                          setActiveMenuTableId(null);
                          toast.success(`Tisch ${table.number} ist jetzt frei.`);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-2 cursor-pointer text-left"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t.available}
                      </button>
                      <button
                        onClick={() => {
                          updateTableStatus(table.id, 'reserved');
                          setActiveMenuTableId(null);
                          toast.success(`Tisch ${table.number} ist jetzt reserviert.`);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer text-left"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t.reserved}
                      </button>
                      <button
                        onClick={() => {
                          updateTableStatus(table.id, 'occupied');
                          setActiveMenuTableId(null);
                          toast.success(`Tisch ${table.number} ist jetzt besetzt.`);
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer text-left"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {t.occupied}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={() => handleDeleteTable(table.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Tisch löschen"
              >
                <Trash2 size={18} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 mt-4">Tisch {table.number}</h2>
              
              <div className="bg-white p-4 rounded-2xl mb-6">
                <QRCodeSVG value={url} size={150} level="H" />
              </div>
              
              <p className="text-xs text-gray-500 mb-6 break-all px-4 line-clamp-2" title={url}>
                {url}
              </p>
              
              <div className="w-full">
                <button 
                  onClick={() => handlePrint(table.number, table.token)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white py-2 rounded-xl transition-colors border border-gray-100 dark:border-white/5"
                >
                  <Printer size={16} />
                  Drucken
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
