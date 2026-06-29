import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChefHat, Flame, Star, MapPin, Phone, Clock } from 'lucide-react';
import { useRef } from 'react';

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity1 = useTransform(scrollY, [0, 500], [0.4, 0]);

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black text-[#1c1c1e] dark:text-white font-sans selection:bg-red-500/20 antialiased tracking-tight">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: y1, opacity: opacity1 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000" 
            alt="Steak on Grill" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
        </motion.div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Flame className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 text-white">
              BLOCK HOUSE
            </h1>
            <p className="text-lg md:text-2xl font-light text-gray-300 mb-8 tracking-wide">
              Premium Steak Experience • Crafted Quality
            </p>
            <Link 
              to="/menu?table=1" 
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[#007aff] dark:bg-[#0a84ff] rounded-[14px] hover:scale-105 transition-all duration-300 shadow-md"
            >
              Menü ansehen (Demo)
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-white dark:bg-[#1c1c1e]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-sm font-bold text-[#ff3b30] uppercase tracking-wider">UNSERE PHILOSOPHIE</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1c1c1e] dark:text-white">Über uns</h2>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
              Seit Jahrzehnten steht BLOCK HOUSE für kompromisslose Qualität und die Kunst des perfekten Grillens. 
              Wir verwenden nur die besten Zutaten und bereiten jedes Steak genau nach Ihren Wünschen auf dem offenen Feuer zu.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] p-5 rounded-[18px] border border-black/5 dark:border-white/5 flex flex-col items-center text-center">
                <ChefHat className="w-8 h-8 text-[#ff3b30] mb-3" />
                <h3 className="text-sm font-bold text-[#1c1c1e] dark:text-white">Meisterköche</h3>
              </div>
              <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] p-5 rounded-[18px] border border-black/5 dark:border-white/5 flex flex-col items-center text-center">
                <Flame className="w-8 h-8 text-[#ff3b30] mb-3" />
                <h3 className="text-sm font-bold text-[#1c1c1e] dark:text-white">Offenes Feuer</h3>
              </div>
            </div>
          </div>
          <div className="relative">
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              src="https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800" 
              alt="Filet Mignon" 
              className="rounded-[24px] shadow-lg border border-black/5 dark:border-white/5 w-full"
              referrerPolicy="no-referrer"
            />
            {/* Animated floating element */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 bg-white/95 dark:bg-[#2c2c2e]/95 backdrop-blur-md p-4 rounded-[18px] shadow-lg border border-black/5 dark:border-white/5 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Star size={20} className="fill-red-500" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Premium</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Qualität</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="py-20 px-4 bg-[#f2f2f7] dark:bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-[#ff3b30] uppercase tracking-wider">GASTRONOMIE</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-1 text-[#1c1c1e] dark:text-white">Beliebte Gerichte</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unsere meistverkauften Spezialitäten</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ribeye Steak', desc: 'Saftiges Ribeye, perfekt marmoriert.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800' },
              { name: 'BLOCK HOUSE Burger', desc: '200g Beef, Cheddar, Bacon, BBQ Sauce.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
              { name: 'T-Bone Steak', desc: 'Der Klassiker mit Knochen. 500g.', img: 'https://images.unsplash.com/photo-1594046243098-0fceea9d451e?auto=format&fit=crop&q=80&w=800' }
            ].map((dish, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white dark:bg-[#1c1c1e] rounded-[24px] overflow-hidden border border-black/5 dark:border-white/5 group relative hover:shadow-lg transition-all duration-300"
              >
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={dish.img} 
                    alt={dish.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {dish.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{dish.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-20 px-4 bg-white dark:bg-[#1c1c1e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-[#ff3b30] uppercase tracking-wider">BESUCHEN SIE UNS</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-1 text-gray-900 dark:text-white">Kontakt & Standort</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] p-6 rounded-[20px] border border-black/5 dark:border-white/5 text-center flex flex-col items-center">
              <MapPin className="w-8 h-8 text-[#ff3b30] mb-3" />
              <h3 className="text-base font-bold mb-1 text-gray-900 dark:text-white">Adresse</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Steakstraße 1<br/>10115 Berlin</p>
            </div>
            <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] p-6 rounded-[20px] border border-black/5 dark:border-white/5 text-center flex flex-col items-center">
              <Phone className="w-8 h-8 text-[#ff3b30] mb-3" />
              <h3 className="text-base font-bold mb-1 text-gray-900 dark:text-white">Telefon</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">+49 30 1234567<br/>Reservierungen erbeten</p>
            </div>
            <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] p-6 rounded-[20px] border border-black/5 dark:border-white/5 text-center flex flex-col items-center">
              <Clock className="w-8 h-8 text-[#ff3b30] mb-3" />
              <h3 className="text-base font-bold mb-1 text-gray-900 dark:text-white">Öffnungszeiten</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Täglich: 11:30 - 23:00<br/>Küche bis 22:30</p>
            </div>
          </div>
          
          {/* Map */}
          <div className="h-[380px] bg-gray-100 dark:bg-[#222] rounded-[24px] border border-black/5 dark:border-white/5 overflow-hidden relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2427.631584992987!2d13.388910315807663!3d52.52191837981446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851e873915155%3A0x633510c4103100!2sBlock%20House%20Friedrichstra%C3%9Fe!5e0!3m2!1sen!2sde!4v1683050000000!5m2!1sen!2sde" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
            ></iframe>
            <a 
              href="https://goo.gl/maps/xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-[#007aff] text-white px-5 py-2.5 rounded-[12px] text-sm font-semibold shadow-md hover:scale-105 transition-transform flex items-center gap-2"
            >
              <MapPin size={16} />
              Wegbeschreibung
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/5 dark:border-white/5 text-center text-gray-500 text-xs">
        <p>&copy; 2026 BLOCK HOUSE Demo. Alle Rechte vorbehalten.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link to="/admin" className="text-[#007aff] hover:underline">Admin Login</Link>
        </div>
      </footer>
    </div>
  );
}
