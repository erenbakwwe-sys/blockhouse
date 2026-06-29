import { formatCurrency } from './utils';

export interface PrintableReceiptData {
  title?: string;
  table: string;
  id?: string;
  createdAt: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    options?: string[];
    notes?: string;
  }>;
  subtotal: number;
  discount?: number;
  tip?: number;
  total: number;
  paymentMethod?: string;
}

export function printThermalReceipt(data: PrintableReceiptData) {
  // 1. Remove any existing print container
  const existingContainer = document.getElementById('thermal-print-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  const existingStyle = document.getElementById('thermal-print-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 2. Create payment method label
  let paymentLabel = 'Noch offen / Unpaid';
  if (data.paymentMethod === 'cash') {
    paymentLabel = 'Barzahlung / Cash';
  } else if (data.paymentMethod === 'card') {
    paymentLabel = 'Kreditkarte / Card';
  } else if (data.paymentMethod === 'pos') {
    paymentLabel = 'Mobiles POS / Card at Table';
  }

  // 3. Create Date & Time strings
  const dateStr = new Date(data.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = new Date(data.createdAt).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 4. Generate items HTML
  const itemsHtml = data.items
    .map(
      (item) => `
      <div class="receipt-item-row">
        <div class="col-name">
          ${item.name}
          ${
            item.options && item.options.length > 0
              ? `<div class="item-extra">[${item.options.join(', ')}]</div>`
              : ''
          }
          ${item.notes ? `<div class="item-extra italic">"${item.notes}"</div>` : ''}
        </div>
        <div class="col-qty">x${item.quantity}</div>
        <div class="col-price">${formatCurrency(item.price)}</div>
        <div class="col-total">${formatCurrency(item.price * item.quantity)}</div>
      </div>
    `
    )
    .join('');

  // 5. Construct full receipt HTML
  const receiptHtml = `
    <div class="receipt-header">
      <h2>BLOCK HOUSE STEAKHOUSE</h2>
      <p>DEINE STEAKHOUSE NO. 1</p>
      <p>Berliner Str. 12, 10115 Berlin</p>
      <p>Tel: 030-12345678</p>
    </div>
    <div class="receipt-divider">------------------------------------------</div>
    <div class="receipt-info">
      <div><strong>TISCH:</strong> Tisch ${data.table}</div>
      ${data.id ? `<div><strong>RECHNUNG-NR:</strong> #${data.id}</div>` : ''}
      <div><strong>DATUM:</strong> ${dateStr}</div>
      <div><strong>UHRZEIT:</strong> ${timeStr}</div>
      <div><strong>ZAHLUNGSART:</strong> ${paymentLabel}</div>
    </div>
    <div class="receipt-divider">------------------------------------------</div>
    <div class="receipt-items">
      <div class="receipt-item-row font-bold header-row">
        <div class="col-name">Artikel</div>
        <div class="col-qty">Mng</div>
        <div class="col-price">Preis</div>
        <div class="col-total">Gesamt</div>
      </div>
      ${itemsHtml}
    </div>
    <div class="receipt-divider">------------------------------------------</div>
    <div class="receipt-totals">
      <div class="receipt-row">
        <span>Zwischensumme:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discount && data.discount > 0
          ? `
      <div class="receipt-row text-discount">
        <span>Rabatt:</span>
        <span>-${formatCurrency(data.discount)}</span>
      </div>`
          : ''
      }
      ${
        data.tip && data.tip > 0
          ? `
      <div class="receipt-row text-tip">
        <span>Trinkgeld:</span>
        <span>+${formatCurrency(data.tip)}</span>
      </div>`
          : ''
      }
      <div class="receipt-divider">------------------------------------------</div>
      <div class="receipt-row receipt-total-row">
        <span>GESAMT:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    </div>
    <div class="receipt-divider">------------------------------------------</div>
    <div class="receipt-footer">
      <p>Vielen Dank für Ihren Besuch!</p>
      <p>BLOCK HOUSE wünscht einen schönen Tag!</p>
      <p>Auf Wiedersehen!</p>
    </div>
  `;

  // 6. Create styled print container
  const printContainer = document.createElement('div');
  printContainer.id = 'thermal-print-container';
  printContainer.innerHTML = receiptHtml;
  document.body.appendChild(printContainer);

  // 7. Create print stylesheet
  const styleElement = document.createElement('style');
  styleElement.id = 'thermal-print-style';
  styleElement.innerHTML = `
    @media print {
      /* Hide regular content */
      body > *:not(#thermal-print-container),
      #root,
      .no-print {
        display: none !important;
      }
      html, body {
        background-color: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #thermal-print-container {
        display: block !important;
        width: 72mm; /* Thermal printer width */
        margin: 0 auto !important;
        padding: 4mm 2mm !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 11px !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: #fff !important;
      }
      @page {
        size: auto;
        margin: 0mm;
      }
    }
    @media screen {
      #thermal-print-container {
        display: none !important;
      }
    }
    #thermal-print-container h2 {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 3px 0;
      text-align: center;
    }
    #thermal-print-container .receipt-header {
      text-align: center;
      margin-bottom: 5px;
    }
    #thermal-print-container .receipt-header p {
      margin: 1px 0;
      font-size: 9px;
    }
    #thermal-print-container .receipt-divider {
      text-align: center;
      margin: 4px 0;
      letter-spacing: -1px;
      font-weight: bold;
    }
    #thermal-print-container .receipt-info {
      margin-bottom: 5px;
      font-size: 9px;
    }
    #thermal-print-container .receipt-info div {
      margin-bottom: 1.5px;
    }
    #thermal-print-container .receipt-items {
      margin-bottom: 5px;
    }
    #thermal-print-container .receipt-item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      align-items: flex-start;
      font-size: 9.5px;
    }
    #thermal-print-container .receipt-item-row.header-row {
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    #thermal-print-container .col-name {
      width: 45%;
      word-break: break-word;
    }
    #thermal-print-container .item-extra {
      font-size: 8px;
      color: #333;
      margin-top: 1px;
      padding-left: 4px;
    }
    #thermal-print-container .col-qty {
      width: 15%;
      text-align: center;
    }
    #thermal-print-container .col-price {
      width: 20%;
      text-align: right;
    }
    #thermal-print-container .col-total {
      width: 20%;
      text-align: right;
    }
    #thermal-print-container .receipt-totals {
      font-size: 10px;
    }
    #thermal-print-container .receipt-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    #thermal-print-container .receipt-total-row {
      font-size: 13px;
      font-weight: bold;
      margin-top: 2px;
    }
    #thermal-print-container .receipt-footer {
      text-align: center;
      margin-top: 8px;
      font-size: 8.5px;
    }
    #thermal-print-container .receipt-footer p {
      margin: 1.5px 0;
    }
  `;
  document.head.appendChild(styleElement);

  // 8. Trigger Print
  setTimeout(() => {
    window.print();
    
    // 9. Cleanup after printing
    const cleanup = () => {
      printContainer.remove();
      styleElement.remove();
    };

    if ('onafterprint' in window) {
      window.addEventListener('afterprint', cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1000);
    }
  }, 100);
}
