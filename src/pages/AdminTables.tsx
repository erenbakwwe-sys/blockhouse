import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Plus } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export default function AdminTables() {
  const { tables } = useStore();
  const [newTableNum, setNewTableNum] = useState('');

  const handleAddTable = () => {
    if (!newTableNum) return;
    // In a real app, we would update the store. For this demo, we'll just show the existing ones.
    // Adding to the store would require adding `addTable` to StoreContext.
    alert('Tisch hinzugefügt (Demo)');
    setNewTableNum('');
  };

  const getTableUrl = (tableNum: string) => {
    // Use the current origin for the QR code URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/menu?table=${tableNum}`;
  };

  const handlePrint = (tableNum: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const url = getTableUrl(tableNum);
    
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
            <!-- We can't easily inject the SVG here without rendering it to a string, 
                 so in a real app we'd use a canvas or a dedicated print route -->
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">QR Tisch Manager</h1>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Tisch Nr." 
            value={newTableNum}
            onChange={(e) => setNewTableNum(e.target.value)}
            className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
          />
          <button 
            onClick={handleAddTable}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Tisch hinzufügen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => {
          const url = getTableUrl(table.number);
          return (
            <div key={table.id} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-6">Tisch {table.number}</h2>
              
              <div className="bg-white p-4 rounded-2xl mb-6">
                <QRCodeSVG value={url} size={150} level="H" />
              </div>
              
              <p className="text-xs text-gray-500 mb-6 break-all px-4">
                {url}
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => handlePrint(table.number)}
                  className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white py-2 rounded-xl transition-colors border border-gray-100 dark:border-white/5"
                >
                  <Printer size={16} />
                  Drucken
                </button>
                <button 
                  onClick={() => alert('Download Funktion in Demo deaktiviert')}
                  className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white py-2 rounded-xl transition-colors border border-gray-100 dark:border-white/5"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
