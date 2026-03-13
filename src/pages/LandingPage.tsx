import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChefHat, Flame, Star, MapPin, Phone, Clock } from 'lucide-react';
import { useRef } from 'react';

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity1 = useTransform(scrollY, [0, 500], [0.4, 0]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white font-sans selection:bg-red-500/30">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111]/50" />
        </motion.div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Flame className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4 text-gray-900 dark:text-white">
              BLOCK HOUSE
            </h1>
            <p className="text-xl md:text-3xl font-light text-gray-300 mb-8 tracking-wide">
              Premium Steak Experience
            </p>
            <Link 
              to="/menu?table=1" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              Menü ansehen (Demo)
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-red-500">Über uns</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Seit Jahrzehnten steht BLOCK HOUSE für kompromisslose Qualität und die Kunst des perfekten Grillens. 
              Wir verwenden nur die besten Zutaten und bereiten jedes Steak genau nach Ihren Wünschen auf dem offenen Feuer zu.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="bg-gray-100 dark:bg-[#222] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
                <ChefHat className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Meisterköche</h3>
              </div>
              <div className="bg-gray-100 dark:bg-[#222] p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
                <Flame className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Offenes Feuer</h3>
              </div>
            </div>
          </div>
          <div className="relative">
            <motion.img 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              src="https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800" 
              alt="Filet Mignon" 
              className="rounded-3xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            {/* Animated floating element */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-[#222] p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Star size={24} className="fill-red-500" />
              </div>
              <div>
                <p className="font-bold">Premium</p>
                <p className="text-sm text-gray-500">Qualität</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-red-500">Beliebte Gerichte</h2>
            <p className="text-gray-500 dark:text-gray-400">Unsere meistverkauften Spezialitäten</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Ribeye Steak', desc: 'Saftiges Ribeye, perfekt marmoriert.', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800' },
              { name: 'BLOCK HOUSE Burger', desc: '200g Beef, Cheddar, Bacon, BBQ Sauce.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' },
              { name: 'T-Bone Steak', desc: 'Der Klassiker mit Knochen. 500g.', img: 'https://images.unsplash.com/photo-1594046243098-0fceea9d451e?auto=format&fit=crop&q=80&w=800' }
            ].map((dish, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 group relative hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.2)] transition-all duration-500 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-transparent group-hover:to-yellow-500/5 transition-colors duration-500 pointer-events-none z-10"></div>
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={dish.img} 
                    alt={dish.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 relative z-20">
                  <h3 className="text-xl font-bold mb-2 relative inline-block self-start">
                    {dish.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-500 group-hover:w-full"></span>
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{dish.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-24 px-4 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-red-500">Kontakt & Standort</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center flex flex-col items-center">
              <MapPin className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Adresse</h3>
              <p className="text-gray-500 dark:text-gray-400">Steakstraße 1<br/>10115 Berlin</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center flex flex-col items-center">
              <Phone className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Telefon</h3>
              <p className="text-gray-500 dark:text-gray-400">+49 30 1234567<br/>Reservierungen erbeten</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-white/5 text-center flex flex-col items-center">
              <Clock className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Öffnungszeiten</h3>
              <p className="text-gray-500 dark:text-gray-400">Täglich: 11:30 - 23:00<br/>Küche bis 22:30</p>
            </div>
          </div>
          
          {/* Map */}
          <div className="h-[400px] bg-gray-100 dark:bg-[#222] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden relative">
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
              className="absolute bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <MapPin size={20} />
              Wegbeschreibung
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2026 BLOCK HOUSE Demo. Alle Rechte vorbehalten.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link to="/admin" className="hover:text-gray-900 dark:text-white transition-colors">Admin Login</Link>
        </div>
      </footer>
    </div>
  );
}
