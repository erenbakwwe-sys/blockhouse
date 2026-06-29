import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Gift, Mail, Phone, User, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_TRANSLATIONS = {
  tr: {
    title: "🎁 Müşteri Teşekkür Hediyesi",
    subtitle: "Siparişiniz için teşekkür ederiz! Sizin için hazırladığımız özel teşekkür kuponunu kazıyarak öğrenin.",
    prompt: "Açmak için Burayı Kazıyın",
    rewardFound: "Teşekkür Hediyeniz:",
    formTitle: "Kuponu Hesabınıza Tanımlayın",
    formSubtitle: "Hediye kuponunuz e-posta ve SMS ile iletilecektir. Bir sonraki siparişinizde anında kullanabilirsiniz.",
    namePlaceholder: "Adınız Soyadınız",
    emailPlaceholder: "E-posta Adresiniz",
    phonePlaceholder: "Telefon Numaranız",
    claimButton: "Kuponu Tanımla & Aktif Et",
    successMsg: "Kuponunuz Başarıyla Tanımlandı!",
    alreadyPlayed: "Bu sipariş için teşekkür hediyenizi zaten aldınız.",
    scratchProgress: "Kazıma Oranı: ",
    closeBtn: "Kapat",
    privacyNotice: "🔒 Kişisel verileriniz KVKK uyarınca korunur ve sadece kupon iletimi için kullanılır."
  },
  de: {
    title: "🎁 Kundentreue & Danke-Geschenk",
    subtitle: "Vielen Dank für Ihre Bestellung! Rubbeln Sie, um Ihren persönlichen Treue-Gutschein aufzudecken.",
    prompt: "Hier rubbeln zum Aufdecken",
    rewardFound: "Ihr Treue-Geschenk:",
    formTitle: "Gutschein aktivieren",
    formSubtitle: "Ihr Gutscheincode wird an Ihre E-Mail gesendet und ist direkt für Ihre nächsten Besuche gültig.",
    namePlaceholder: "Ihr Name",
    emailPlaceholder: "Ihre E-Mail-Adresse",
    phonePlaceholder: "Ihre Telefonnummer",
    claimButton: "Gutschein anfordern & aktivieren",
    successMsg: "Gutschein erfolgreich gespeichert!",
    alreadyPlayed: "Sie haben Ihr Treue-Geschenk für diese Bestellung bereits abgeholt.",
    scratchProgress: "Fortschritt: ",
    closeBtn: "Schließen",
    privacyNotice: "🔒 Ihre Daten werden gemäß DSGVO sicher geschützt und nur für den Gutscheinversand verwendet."
  },
  en: {
    title: "🎁 Customer Appreciation Reward",
    subtitle: "Thank you for your order! Scratch below to reveal your personal loyalty coupon.",
    prompt: "Scratch Here to Reveal",
    rewardFound: "Your Appreciation Gift:",
    formTitle: "Activate Your Coupon",
    formSubtitle: "Your coupon code will be sent via Email & SMS and is redeemable on your next orders.",
    namePlaceholder: "Your Name",
    emailPlaceholder: "Your Email Address",
    phonePlaceholder: "Your Phone Number",
    claimButton: "Activate & Claim Coupon",
    successMsg: "Coupon Activated Successfully!",
    alreadyPlayed: "You have already claimed your appreciation gift for this order.",
    scratchProgress: "Scratch Progress: ",
    closeBtn: "Close",
    privacyNotice: "🔒 Your personal data is securely protected under GDPR and used solely for coupon delivery."
  }
};

const PRIZES_BY_LANG = {
  tr: [
    "Çikolatalı Sufle (Ücretsiz)",
    "%15 İndirim Kuponu",
    "Büyük Boy Kola veya Fanta (Ücretsiz)",
    "Sıcak Künefe (Ücretsiz)",
    "Filtre Kahve veya Türk Kahvesi (Ücretsiz)",
    "Havuç Dilim Baklava (Ücretsiz)"
  ],
  de: [
    "Schokoladen-Soufflé (Kostenlos)",
    "15% Rabatt-Gutschein",
    "Erfrischungsgetränk nach Wahl (Kostenlos)",
    "Heißes Künefe (Kostenlos)",
    "Filterkaffee oder Türkischer Kaffee (Kostenlos)",
    "Baklava (Kostenlos)"
  ],
  en: [
    "Chocolate Soufflé (Free)",
    "15% Discount Coupon",
    "Soft Drink of Choice (Free)",
    "Hot Künefe (Free)",
    "Filter Coffee or Turkish Coffee (Free)",
    "Baklava (Free)"
  ]
};

interface ScratchCardProps {
  orderId: string;
  table: string;
  onClose?: () => void;
}

export default function ScratchCardGame({ orderId, table, onClose }: ScratchCardProps) {
  const { language } = useStore();
  const t = LOCAL_TRANSLATIONS[language as keyof typeof LOCAL_TRANSLATIONS] || LOCAL_TRANSLATIONS.en;
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);

  const [hasPlayed, setHasPlayed] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState('');
  const [isScratchedEnough, setIsScratchedEnough] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize prize on mount
  useEffect(() => {
    // Check if played for this order
    const playedKey = `scratch_played_${orderId}`;
    if (localStorage.getItem(playedKey)) {
      setHasPlayed(true);
      const savedPrize = localStorage.getItem(`scratch_prize_${orderId}`);
      if (savedPrize) {
        setSelectedPrize(savedPrize);
        setIsScratchedEnough(true);
      }
      const savedSubmitted = localStorage.getItem(`scratch_sub_${orderId}`);
      if (savedSubmitted) {
        setIsSubmitted(true);
      }
    } else {
      const list = PRIZES_BY_LANG[language as keyof typeof PRIZES_BY_LANG] || PRIZES_BY_LANG.en;
      const randomPrize = list[Math.floor(Math.random() * list.length)];
      setSelectedPrize(randomPrize);
    }
  }, [orderId, language]);

  // Set up Canvas
  useEffect(() => {
    if (hasPlayed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Set display size
    canvas.width = 300;
    canvas.height = 160;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gold metallic gradient
    const goldGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    goldGrad.addColorStop(0, '#B8860B'); // Dark Goldenrod
    goldGrad.addColorStop(0.25, '#DAA520'); // Goldenrod
    goldGrad.addColorStop(0.5, '#F0E68C'); // Khaki/Light Gold
    goldGrad.addColorStop(0.75, '#DAA520');
    goldGrad.addColorStop(1, '#B8860B');

    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add luxury fine speckle noise for golden foil texture
    ctx.fillStyle = '#FFD700'; // Pure Gold Sparkle
    for (let i = 0; i < 600; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const rSize = Math.random() * 1.5 + 0.5;
      ctx.fillRect(rx, ry, rSize, rSize);
    }

    // Add fine dark-gold veins/patterns
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }

    // Draw elegant borders on the foil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw some elegant typography onto the scratch overlay
    ctx.fillStyle = '#4A3B18'; // Dark metallic gold
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.prompt.toUpperCase(), canvas.width / 2, canvas.height / 2);

    ctx.lineCap = 'round';
    ctx.lineWidth = 26;
    ctx.strokeStyle = '#000000';
    ctx.globalCompositeOperation = 'destination-out';
    contextRef.current = ctx;
  }, [hasPlayed, t.prompt]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event or mouse event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = '#000000';
    contextRef.current.lineWidth = 26;
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    isDrawing.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !contextRef.current || isScratchedEnough) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    contextRef.current.strokeStyle = '#000000';
    contextRef.current.lineWidth = 26;
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    checkScratchProgress();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const checkScratchProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let clearedPixels = 0;
    const totalPixels = data.length / 4;

    // Check alpha values to see how many pixels are scratched off (alpha = 0)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) {
        clearedPixels++;
      }
    }

    const calculatedProgress = Math.round((clearedPixels / totalPixels) * 100);
    setProgress(calculatedProgress);

    if (calculatedProgress > 45) {
      setIsScratchedEnough(true);
      // Save play status
      const playedKey = `scratch_played_${orderId}`;
      localStorage.setItem(playedKey, 'true');
      localStorage.setItem(`scratch_prize_${orderId}`, selectedPrize);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error(language === 'tr' ? 'Lütfen tüm alanları doldurun.' : 'Please fill all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const leadId = Math.random().toString(36).substring(2, 9);
      const leadData = {
        id: leadId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gift: selectedPrize,
        table: table,
        createdAt: Date.now(),
        claimed: true
      };

      await setDoc(doc(collection(db, 'scratch_leads'), leadId), leadData);
      
      localStorage.setItem(`scratch_sub_${orderId}`, 'true');
      setIsSubmitted(true);
      toast.success(t.successMsg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'scratch_leads');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#141416] dark:bg-[#0c0c0e] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-[#d4af37]/30">
      {/* Subtle gold elegant gradient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start gap-4 relative z-10 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#d4af37]">SADAKAT PROGRAMI</span>
          </div>
          <h3 className="font-extrabold text-lg sm:text-xl leading-tight text-white">{t.title}</h3>
          <p className="text-xs text-stone-300 mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {!isScratchedEnough ? (
          <div className="w-full flex flex-col items-center py-4">
            {/* The actual Scratch card container */}
            <div className="relative w-[300px] h-[160px] bg-[#1a1a1c] rounded-2xl border border-[#d4af37]/15 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Revealed prize background content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-4xl mb-1">🎁</span>
                <p className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider">{t.rewardFound}</p>
                <p className="font-black text-lg text-white mt-1.5 line-clamp-2">{selectedPrize}</p>
              </div>

              {/* Canvas Scratch overlay */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute top-0 left-0 cursor-crosshair rounded-2xl touch-none"
              />
            </div>
            
            {/* Scratch progress indicator */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
              <p className="text-[11px] font-semibold text-stone-300 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                {t.scratchProgress} <span className="text-[#d4af37] font-extrabold">{progress}%</span>
              </p>
              
              <button
                onClick={() => {
                  setIsScratchedEnough(true);
                  const playedKey = `scratch_played_${orderId}`;
                  localStorage.setItem(playedKey, 'true');
                  localStorage.setItem(`scratch_prize_${orderId}`, selectedPrize);
                }}
                className="text-[11px] font-semibold text-[#d4af37]/80 hover:text-[#d4af37] underline transition-colors cursor-pointer py-1 px-3"
              >
                {language === 'tr' ? 'Kuponu Direkt Aç 🔓' : language === 'de' ? 'Gutschein direkt öffnen 🔓' : 'Reveal Coupon 🔓'}
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="claim-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-[#1b1b1d] rounded-2xl p-5 border border-[#d4af37]/20 shadow-lg mt-2"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#aa7c11] text-black rounded-full flex items-center justify-center mx-auto mb-2 font-bold shadow-lg animate-bounce">
                    <Gift className="w-5 h-5 text-black" />
                  </div>
                  <p className="text-xs text-[#d4af37] font-bold uppercase tracking-wider">{t.rewardFound}</p>
                  <h4 className="text-lg font-black text-white mt-0.5">{selectedPrize}</h4>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm font-bold text-center mb-1 text-white">{t.formTitle}</h5>
                  <p className="text-[11px] text-stone-300 text-center mb-4 leading-relaxed">{t.formSubtitle}</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs placeholder-stone-500 text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-medium"
                      />
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs placeholder-stone-500 text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-medium"
                      />
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs placeholder-stone-500 text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#d4af37] hover:bg-[#b8860b] text-black font-extrabold py-2.5 rounded-xl transition-all shadow-md shadow-[#d4af37]/10 cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{t.claimButton}</span>
                        </>
                      )}
                    </button>
                  </form>
                  <p className="text-[9px] text-stone-400 mt-3 text-center leading-normal font-medium">{t.privacyNotice}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-[#1b1b1d] rounded-2xl p-6 border border-[#d4af37]/25 text-center shadow-lg mt-2"
              >
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold mb-1 text-white">{t.successMsg}</h4>
                <p className="text-xs text-stone-300 max-w-sm mx-auto mb-4 leading-relaxed">
                  {selectedPrize} {language === 'tr' ? 'hediyeniz başarıyla tanımlandı. Kupon detayları e-posta ve SMS ile iletilmiştir.' : 'gift successfully defined. Details sent to your contact details.'}
                </p>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all border border-white/10"
                  >
                    {t.closeBtn}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
