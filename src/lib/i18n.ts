// Internationalization (i18n) translator supporting TR, EN, DE
export type Lang = 'tr' | 'en' | 'de';

export const i18n = {
  currentLang: (localStorage.getItem('saas_lang') as Lang) || 'de',

  setLang(lang: Lang) {
    this.currentLang = lang;
    localStorage.setItem('saas_lang', lang);
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  },

  t(key: string, replacements?: Record<string, string | number>): string {
    const keys = key.split('.');
    let translation: any = translations[this.currentLang];
    
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Fallback to English if not found
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // return key as fallback
          }
        }
        translation = fallback;
        break;
      }
    }

    if (typeof translation !== 'string') {
      return key;
    }

    if (replacements) {
      let result = translation;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
      }
      return result;
    }

    return translation;
  }
};

const translations: Record<Lang, any> = {
  tr: {
    brand: "SaaS QR Restoran",
    tagline: "Modern QR Menü, Adisyon & POS Sistemi",
    description: "Restoranınızı dijitalleştirin! QR Menü, Canlı Sipariş, Stok Takibi, Personel Yönetimi ve POS hepsi tek bir platformda.",
    tryDemo: "Ücretsiz Demoyu Dene",
    login: "Yönetici Girişi",
    register: "Restoran Kaydı",
    logout: "Çıkış Yap",
    email: "E-posta Adresi",
    password: "Şifre",
    restaurantName: "Restoran Adı",
    phone: "Telefon",
    address: "Adres",
    backToHome: "Ana Sayfaya Dön",
    noAccount: "Hesabınız yok mu? Hemen kaydolun",
    hasAccount: "Zaten üye misiniz? Giriş yapın",
    demoModeActive: "DEMO MODU AKTİF - Tüm veriler tarayıcınızda geçici olarak saklanır.",
    
    sidebar: {
      dashboard: "Kontrol Paneli",
      orders: "Canlı Siparişler",
      pos: "POS & Masalar",
      menu: "Menü Yönetimi",
      stock: "Stok & Envanter",
      staff: "Personel & Şube",
      coupons: "Pazarlama & Kupon",
      analytics: "Finansal Analitik",
      aiTheme: "AI Tema Tasarımcısı"
    },

    dashboard: {
      activeTables: "Aktif Masalar",
      pendingOrders: "Bekleyen Siparişler",
      openBills: "Açık Adisyonlar",
      dailyRevenue: "Günlük Toplam Gelir",
      cashRevenue: "Nakit Gelir",
      cardRevenue: "Kredi Kartı",
      posRevenue: "POS",
      notifications: "Canlı Bildirimler",
      noNotifications: "Henüz yeni bildirim yok.",
      waiterCalled: "Masa {table} garson çağırıyor!",
      newOrderReceived: "Masa {table} yeni sipariş verdi!"
    },

    orders: {
      title: "Canlı Sipariş Yönetimi",
      colNew: "Yeni Siparişler",
      colPreparing: "Hazırlanıyor",
      colReady: "Hazır",
      colCompleted: "Tamamlandı (Arşiv)",
      printKitchen: "Mutfak Fişi",
      total: "Toplam",
      noOrders: "Bu aşamada sipariş yok.",
      moveToPreparing: "Hazırlanıyor Yap",
      moveToReady: "Hazır İşaretle",
      moveToCompleted: "Arşivle",
      kitchenSlip: "Mutfak Bilgi Fişi",
      orderTime: "Sipariş Zamanı",
      paymentType: "Ödeme Tipi",
      notes: "Sipariş Notu",
      items: "Ürünler"
    },

    pos: {
      title: "Masa & Adisyon POS",
      addOrder: "Hızlı Ekle",
      tableStatus: "Masa Durumu",
      tableEmpty: "Boş",
      tableFull: "Açık Adisyon",
      tableTab: "Adisyon Detayı",
      tableNo: "Masa {no}",
      openBill: "Adisyon Aç",
      closeBill: "Ödeme Al & Kapat",
      splitBill: "Hesap Bölüşme",
      transferTable: "Masa Taşı",
      complimentary: "İkram",
      discount: "İndirim",
      tip: "Bahşiş",
      totalPrice: "Genel Toplam",
      person: "Kişi",
      perPerson: "Kişi Başı",
      payCash: "Nakit Öde",
      payCard: "Kart Öde",
      cancel: "İptal",
      save: "Kaydet",
      printReceipt: "Adisyon Yazdır",
      receiptHeader: "Hesap Fişi"
    },

    menu: {
      title: "Menü & Reçete Yönetimi",
      addCategory: "Kategori Ekle",
      addProduct: "Ürün Ekle",
      catName: "Kategori Adı",
      prodName: "Ürün Adı",
      price: "Fiyat",
      emoji: "Emoji/Fotoğraf URL",
      description: "Açıklama",
      recipe: "Stok Reçetesi",
      netProfit: "Net Kâr",
      profitMargin: "Kâr Marjı",
      addIngredient: "Malzeme Ekle",
      selectIngredient: "Hammadde Seç",
      amountNeeded: "Gereken Miktar",
      stockStatus: "Stok Durumu",
      inStock: "Stokta",
      outOfStock: "Tükendi"
    },

    stock: {
      title: "Stok & Envanter",
      addMaterial: "Hammadde Ekle",
      matName: "Malzeme Adı",
      unit: "Birim",
      qty: "Miktar",
      remaining: "Kalan",
      unitCost: "Birim Maliyet",
      totalValue: "Stok Değeri",
      critical: "KRİTİK STOK",
      empty: "BİTTİ",
      deleteWarning: "Bu malzeme menü ürünlerinde kullanılmaktadır! Silmek istediğinize emin misiniz?"
    },

    staff: {
      title: "Personel & Şube",
      addStaff: "Personel Ekle",
      addBranch: "Şube Ekle",
      staffName: "Personel Adı",
      pin: "Giriş Pini",
      role: "Yetki/Rol",
      branchName: "Şube Adı",
      workingHours: "Çalışma Saatleri",
      branchPhone: "Şube Telefon"
    },

    coupons: {
      title: "Pazarlama & Kuponlar",
      addCoupon: "Kupon Oluştur",
      code: "Kupon Kodu",
      type: "Kupon Tipi",
      value: "İndirim Değeri",
      minSpend: "Min. Sepet Tutarı",
      limit: "Kullanım Limiti",
      expiry: "Son Kullanma Tarihi",
      happyHour: "Happy Hour Kuralları",
      addRule: "Happy Hour Kuralı Ekle",
      percent: "Yüzde (%)",
      flat: "Sabit Tutar",
      timeRange: "Geçerli Saatler"
    },

    analytics: {
      title: "Finansal Analitik & Grafikler",
      weeklyTrend: "Haftalık Ciro Trendi",
      topSelling: "En Çok Satan Ürünler",
      paymentDist: "Ödeme Yöntemleri Dağılımı",
      tipStats: "Toplam Bahşişler",
      totalSales: "Toplam Satış"
    },

    aiTheme: {
      title: "AI Tema Tasarımcısı",
      promptLabel: "Yapay Zeka Tasarım Promptu",
      promptPlaceholder: "Örn: Loş ışıklı lüks bir suşi restoranı teması yap...",
      generate: "Temayı Uygula",
      presets: "Hazır Şablonlar",
      coffeeShop: "Sıcak Kahve Dükkanı",
      fineDining: "Lüks Fine Dining",
      pizzeria: "İtalyan Pizzeria",
      beachClub: "Canlı Beach Club"
    },

    customer: {
      welcome: "Hoş Geldiniz",
      table: "Masa {no}",
      cart: "Sepetim",
      emptyCart: "Sepetiniz boş.",
      notes: "Özel istekleriniz...",
      placeOrder: "Sipariş Ver",
      callWaiter: "Garson Çağır",
      voiceCommand: "Sesli Garson Çağırma",
      voiceActive: 'Sesli komut aktif. "Garson" deyin',
      voiceInactive: "Sesli komut devre dışı",
      addedToCart: "Sepete eklendi!",
      orderPlaced: "Siparişiniz mutfağa iletildi!",
      waiterCalled: "Garson çağrısı yapıldı!",
      backToMenu: "Menüye Dön",
      checkout: "Siparişi Tamamla",
      paymentMethod: "Ödeme Yöntemi",
      selectPayment: "Ödeme yöntemi seçin",
      cash: "Nakit",
      card: "Kredi Kartı",
      pos: "Fiziksel POS",
      invoice: "Adisyon",
      statusTitle: "Sipariş Durumu",
      statusReceived: "Sipariş Alındı",
      statusPreparing: "Mutfakta Hazırlanıyor",
      statusReady: "Servise Hazır",
      statusServed: "Afiyet Olsun!"
    },
    popup: {
      title: "🚀 WhatsApp ile Ücretsiz Kurulum!",
      body: "Demo süreniz başladı! Restoranınız için QR Menü ve POS sistemini 5 dakikada kurmak, özel tekliflerimizden yararlanmak için hemen bizimle WhatsApp üzerinden iletişime geçin.",
      cta: "WhatsApp ile Hemen Kur",
      later: "Daha Sonra İncele"
    }
  },
  en: {
    brand: "SaaS QR Restaurant",
    tagline: "Modern QR Menu, Billing & POS System",
    description: "Digitalize your restaurant! QR Menu, Live Orders, Stock Tracking, Staff Management, and POS all in one platform.",
    tryDemo: "Try Free Demo",
    login: "Admin Login",
    register: "Register Restaurant",
    logout: "Log Out",
    email: "Email Address",
    password: "Password",
    restaurantName: "Restaurant Name",
    phone: "Phone",
    address: "Address",
    backToHome: "Back to Home",
    noAccount: "Don't have an account? Register now",
    hasAccount: "Already registered? Log in",
    demoModeActive: "DEMO MODE ACTIVE - All data stored temporarily in your browser.",
    
    sidebar: {
      dashboard: "Dashboard",
      orders: "Live Orders",
      pos: "POS & Tables",
      menu: "Menu Management",
      stock: "Stock & Inventory",
      staff: "Staff & Branch",
      coupons: "Marketing & Coupon",
      analytics: "Financial Analytics",
      aiTheme: "AI Theme Designer"
    },

    dashboard: {
      activeTables: "Active Tables",
      pendingOrders: "Pending Orders",
      openBills: "Open Bills",
      dailyRevenue: "Daily Total Revenue",
      cashRevenue: "Cash Revenue",
      cardRevenue: "Credit Card",
      posRevenue: "POS",
      notifications: "Live Notifications",
      noNotifications: "No new notifications yet.",
      waiterCalled: "Table {table} is calling a waiter!",
      newOrderReceived: "Table {table} placed a new order!"
    },

    orders: {
      title: "Live Order Management",
      colNew: "New Orders",
      colPreparing: "Preparing",
      colReady: "Ready",
      colCompleted: "Completed (Archived)",
      printKitchen: "Kitchen Ticket",
      total: "Total",
      noOrders: "No orders in this stage.",
      moveToPreparing: "Set to Preparing",
      moveToReady: "Mark as Ready",
      moveToCompleted: "Archive",
      kitchenSlip: "Kitchen Info Slip",
      orderTime: "Order Time",
      paymentType: "Payment Type",
      notes: "Order Notes",
      items: "Items"
    },

    pos: {
      title: "Table & Billing POS",
      addOrder: "Quick Add",
      tableStatus: "Table Status",
      tableEmpty: "Empty",
      tableFull: "Open Bill",
      tableTab: "Bill Details",
      tableNo: "Table {no}",
      openBill: "Open Bill",
      closeBill: "Pay & Close",
      splitBill: "Split Bill",
      transferTable: "Transfer Table",
      complimentary: "Complimentary",
      discount: "Discount",
      tip: "Tip",
      totalPrice: "Grand Total",
      person: "People",
      perPerson: "Per Person",
      payCash: "Pay Cash",
      payCard: "Pay Card",
      cancel: "Cancel",
      save: "Save",
      printReceipt: "Print Receipt",
      receiptHeader: "Billing Receipt"
    },

    menu: {
      title: "Menu & Recipe Management",
      addCategory: "Add Category",
      addProduct: "Add Product",
      catName: "Category Name",
      prodName: "Product Name",
      price: "Price",
      emoji: "Emoji/Photo URL",
      description: "Description",
      recipe: "Stock Recipe",
      netProfit: "Net Profit",
      profitMargin: "Profit Margin",
      addIngredient: "Add Ingredient",
      selectIngredient: "Select Raw Material",
      amountNeeded: "Amount Needed",
      stockStatus: "Stock Status",
      inStock: "In Stock",
      outOfStock: "Out of Stock"
    },

    stock: {
      title: "Stock & Inventory",
      addMaterial: "Add Raw Material",
      matName: "Material Name",
      unit: "Unit",
      qty: "Quantity",
      remaining: "Remaining",
      unitCost: "Unit Cost",
      totalValue: "Stock Value",
      critical: "CRITICAL STOCK",
      empty: "OUT",
      deleteWarning: "This material is used in menu items! Are you sure you want to delete it?"
    },

    staff: {
      title: "Staff & Branch",
      addStaff: "Add Staff",
      addBranch: "Add Branch",
      staffName: "Staff Name",
      pin: "Login PIN",
      role: "Permission/Role",
      branchName: "Branch Name",
      workingHours: "Working Hours",
      branchPhone: "Branch Phone"
    },

    coupons: {
      title: "Marketing & Coupons",
      addCoupon: "Create Coupon",
      code: "Coupon Code",
      type: "Coupon Type",
      value: "Discount Value",
      minSpend: "Min Basket Amount",
      limit: "Usage Limit",
      expiry: "Expiry Date",
      happyHour: "Happy Hour Rules",
      addRule: "Add Happy Hour Rule",
      percent: "Percentage (%)",
      flat: "Fixed Amount",
      timeRange: "Valid Hours"
    },

    analytics: {
      title: "Financial Analytics & Charts",
      weeklyTrend: "Weekly Revenue Trend",
      topSelling: "Top Selling Products",
      paymentDist: "Payment Methods Distribution",
      tipStats: "Total Tips",
      totalSales: "Total Sales"
    },

    aiTheme: {
      title: "AI Theme Designer",
      promptLabel: "AI Design Prompt",
      promptPlaceholder: "E.g.: Create a dim-lit luxury sushi restaurant theme...",
      generate: "Apply Theme",
      presets: "Presets",
      coffeeShop: "Warm Coffee Shop",
      fineDining: "Luxury Fine Dining",
      pizzeria: "Italian Pizzeria",
      beachClub: "Vibrant Beach Club"
    },

    customer: {
      welcome: "Welcome",
      table: "Table {no}",
      cart: "My Cart",
      emptyCart: "Your cart is empty.",
      notes: "Special requests...",
      placeOrder: "Place Order",
      callWaiter: "Call Waiter",
      voiceCommand: "Voice Waiter Call",
      voiceActive: 'Voice command active. Say "Waiter"',
      voiceInactive: "Voice command deactivated",
      addedToCart: "Added to cart!",
      orderPlaced: "Your order is sent to kitchen!",
      waiterCalled: "Waiter has been called!",
      backToMenu: "Back to Menu",
      checkout: "Complete Order",
      paymentMethod: "Payment Method",
      selectPayment: "Select payment method",
      cash: "Cash",
      card: "Credit Card",
      pos: "Physical POS (Card at Table)",
      invoice: "Invoice",
      statusTitle: "Order Status",
      statusReceived: "Order Received",
      statusPreparing: "Preparing in Kitchen",
      statusReady: "Ready to Serve",
      statusServed: "Enjoy your meal!"
    },
    popup: {
      title: "🚀 Free Installation via WhatsApp!",
      body: "Your demo period has started! Contact us on WhatsApp right now to install QR Menu and POS for your restaurant in 5 minutes and benefit from our special deals.",
      cta: "Install on WhatsApp Now",
      later: "Explore Later"
    }
  },
  de: {
    brand: "SaaS QR Restaurant",
    tagline: "Modernes QR-Menü-, Abrechnungs- & POS-System",
    description: "Digitalisieren Sie Ihr Restaurant! QR-Menü, Live-Bestellungen, Lagerbestandsverfolgung, Personalverwaltung und POS auf einer Plattform.",
    tryDemo: "Kostenlose Demo testen",
    login: "Admin-Anmeldung",
    register: "Restaurant registrieren",
    logout: "Abmelden",
    email: "E-Mail-Adresse",
    password: "Passwort",
    restaurantName: "Restaurantname",
    phone: "Telefon",
    address: "Adresse",
    backToHome: "Zurück zur Startseite",
    noAccount: "Haben Sie kein Konto? Jetzt registrieren",
    hasAccount: "Bereits registriert? Einloggen",
    demoModeActive: "DEMO-MODUS AKTIV - Alle Daten werden temporär im Browser gespeichert.",
    
    sidebar: {
      dashboard: "Kontrollzentrum",
      orders: "Live-Bestellungen",
      pos: "POS & Tische",
      menu: "Menüverwaltung",
      stock: "Lagerbestand",
      staff: "Personal & Filialen",
      coupons: "Marketing & Gutscheine",
      analytics: "Finanzanalysen",
      aiTheme: "AI-Themendesigner"
    },

    dashboard: {
      activeTables: "Aktive Tische",
      pendingOrders: "Ausstehende Bestellungen",
      openBills: "Offene Rechnungen",
      dailyRevenue: "Täglicher Gesamtumsatz",
      cashRevenue: "Bareinnahmen",
      cardRevenue: "Kreditkarte",
      posRevenue: "POS",
      notifications: "Live-Benachrichtigungen",
      noNotifications: "Noch keine neuen Benachrichtigungen.",
      waiterCalled: "Tisch {table} ruft den Kellner!",
      newOrderReceived: "Tisch {table} hat eine neue Bestellung aufgegeben!"
    },

    orders: {
      title: "Live-Bestellungsverwaltung",
      colNew: "Neue Bestellungen",
      colPreparing: "In Zubereitung",
      colReady: "Bereit",
      colCompleted: "Abgeschlossen (Archiviert)",
      printKitchen: "Küchenbeleg",
      total: "Gesamt",
      noOrders: "Keine Bestellungen in dieser Phase.",
      moveToPreparing: "In Zubereitung verschieben",
      moveToReady: "Als Bereit markieren",
      moveToCompleted: "Archivieren",
      kitchenSlip: "Küchen-Infoschein",
      orderTime: "Bestellzeit",
      paymentType: "Zahlungsart",
      notes: "Bestellhinweise",
      items: "Artikel"
    },

    pos: {
      title: "Tisch & Abrechnungs-POS",
      addOrder: "Schnell hinzufügen",
      tableStatus: "Tischstatus",
      tableEmpty: "Leer",
      tableFull: "Offene Abrechnung",
      tableTab: "Rechnungsdetails",
      tableNo: "Tisch {no}",
      openBill: "Rechnung öffnen",
      closeBill: "Zahlen & Schließen",
      splitBill: "Rechnung teilen",
      transferTable: "Tisch verschieben",
      complimentary: "Aufs Haus (Gratis)",
      discount: "Rabatt",
      tip: "Trinkgeld",
      totalPrice: "Gesamtsumme",
      person: "Personen",
      perPerson: "Pro Person",
      payCash: "Bar bezahlen",
      payCard: "Mit Karte zahlen",
      cancel: "Abbrechen",
      save: "Speichern",
      printReceipt: "Abrechnung drucken",
      receiptHeader: "Rechnungsbeleg"
    },

    menu: {
      title: "Menü- & Rezeptverwaltung",
      addCategory: "Kategorie hinzufügen",
      addProduct: "Produkt hinzufügen",
      catName: "Kategoriename",
      prodName: "Produktname",
      price: "Preis",
      emoji: "Emoji/Foto-URL",
      description: "Beschreibung",
      recipe: "Lagerrezeptur",
      netProfit: "Nettogewinn",
      profitMargin: "Gewinnmarge",
      addIngredient: "Zutat hinzufügen",
      selectIngredient: "Rohmaterial auswählen",
      amountNeeded: "Benötigte Menge",
      stockStatus: "Lagerstatus",
      inStock: "Auf Lager",
      outOfStock: "Ausverkauft"
    },

    stock: {
      title: "Lager & Bestand",
      addMaterial: "Rohmaterial hinzufügen",
      matName: "Materialname",
      unit: "Einheit",
      qty: "Menge",
      remaining: "Verbleibend",
      unitCost: "Stückkosten",
      totalValue: "Lagerwert",
      critical: "KRITISCHER BESTAND",
      empty: "LEER",
      deleteWarning: "Dieses Material wird in Menüartikeln verwendet! Sind Sie sicher, dass Sie es löschen möchten?"
    },

    staff: {
      title: "Personal & Filialen",
      addStaff: "Personal hinzufügen",
      addBranch: "Filiale hinzufügen",
      staffName: "Mitarbeitername",
      pin: "Anmelde-PIN",
      role: "Berechtigung/Rolle",
      branchName: "Filialname",
      workingHours: "Arbeitszeiten",
      branchPhone: "Filialtelefon"
    },

    coupons: {
      title: "Marketing & Gutscheine",
      addCoupon: "Gutschein erstellen",
      code: "Gutscheincode",
      type: "Gutscheintyp",
      value: "Rabattwert",
      minSpend: "Mindestbestellwert",
      limit: "Nutzungslimit",
      expiry: "Ablaufdatum",
      happyHour: "Happy-Hour-Regeln",
      addRule: "Happy-Hour-Regel hinzufügen",
      percent: "Prozentsatz (%)",
      flat: "Festbetrag",
      timeRange: "Gültige Zeiten"
    },

    analytics: {
      title: "Finanzanalysen & Diagramme",
      weeklyTrend: "Wöchentlicher Umsatztrend",
      topSelling: "Meistverkaufte Produkte",
      paymentDist: "Verteilung der Zahlungsmethoden",
      tipStats: "Trinkgeld-Statistiken",
      totalSales: "Gesamtumsatz"
    },

    aiTheme: {
      title: "AI-Themendesigner",
      promptLabel: "AI-Design-Prompt",
      promptPlaceholder: "Z.B.: Erstelle ein gedimmtes Luxus-Sushi-Restaurant...",
      generate: "Design anwenden",
      presets: "Voreinstellungen",
      coffeeShop: "Warmes Café",
      fineDining: "Luxus-Fine-Dining",
      pizzeria: "Italienische Pizzeria",
      beachClub: "Lebhafter Beach Club"
    },

    customer: {
      welcome: "Willkommen",
      table: "Tisch {no}",
      cart: "Mein Warenkorb",
      emptyCart: "Ihr Warenkorb ist leer.",
      notes: "Sonderwünsche...",
      placeOrder: "Bestellung aufgeben",
      callWaiter: "Kellner rufen",
      voiceCommand: "Sprach-Ruf",
      voiceActive: 'Sprachsteuerung aktiv. Sagen Sie "Kellner"',
      voiceInactive: "Sprachsteuerung deaktiviert",
      addedToCart: "Zum Warenkorb hinzugefügt!",
      orderPlaced: "Ihre Bestellung wurde an die Küche gesendet!",
      waiterCalled: "Der Kellner wurde gerufen!",
      backToMenu: "Zurück zum Menü",
      checkout: "Bestellung abschließen",
      paymentMethod: "Zahlungsmethode",
      selectPayment: "Zahlungsmethode auswählen",
      cash: "Barzahlung",
      card: "Kreditkarte",
      pos: "Kartenzahlung am Tisch (POS)",
      invoice: "Abrechnung",
      statusTitle: "Bestellstatus",
      statusReceived: "Bestellung erhalten",
      statusPreparing: "In Zubereitung in der Küche",
      statusReady: "Bereit zum Servieren",
      statusServed: "Guten Appetit!"
    },
    popup: {
      title: "🚀 Kostenlose Einrichtung über WhatsApp!",
      body: "Ihre Demo-Periode hat begonnen! Kontaktieren Sie uns jetzt per WhatsApp, um das QR-Menü und POS in 5 Minuten für Ihr Restaurant einzurichten und von Sonderangeboten zu profitieren.",
      cta: "Jetzt über WhatsApp einrichten",
      later: "Später erkunden"
    }
  }
};
