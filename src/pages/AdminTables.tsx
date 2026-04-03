import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import toast from 'react-hot-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminTables() {
  const { tables, addTable } = useStore();
  const [tableCount, setTableCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
          return (
            <div key={table.id} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center relative">
              <button 
                onClick={() => handleDeleteTable(table.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Tisch löschen"
              >
                <Trash2 size={18} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Tisch {table.number}</h2>
              
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
