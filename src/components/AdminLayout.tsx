import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, UtensilsCrossed, Bell, LogOut, History, Lock, LineChart } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

export default function AdminLayout() {
  const { calls } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activeCalls = calls.filter(c => c.status === 'active').length;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [blinkOrder, setBlinkOrder] = useState(false);
  const [blinkCall, setBlinkCall] = useState(false);
  const locationRef = useRef(location.pathname);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    locationRef.current = location.pathname;
    if (location.pathname === '/admin') setBlinkOrder(false);
    if (location.pathname === '/admin/calls') setBlinkCall(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const playSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // C6 and E6 for a pleasant "ding"
        osc1.frequency.setValueAtTime(1046.50, ctx.currentTime);
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        
        osc1.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
      } catch (error) {
        console.error("Audio play failed", error);
      }
    };

    // Listen for new orders
    const now = Date.now();
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', now),
      orderBy('createdAt', 'desc')
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      if (initialLoadRef.current) return; // Skip initial load
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          playSound();
          if (locationRef.current !== '/admin') {
            setBlinkOrder(true);
          }
          toast.success(`Neue Bestellung (Tisch ${order.table})`, {
            icon: '🍽️',
            duration: 8000,
            style: {
              background: '#222',
              color: '#fff',
              border: '1px solid #ef4444'
            }
          });
        }
      });
    });

    // Listen for new calls
    const callsQuery = query(
      collection(db, 'calls'),
      where('createdAt', '>=', now),
      orderBy('createdAt', 'desc')
    );

    const unsubCalls = onSnapshot(callsQuery, (snapshot) => {
      if (initialLoadRef.current) return; // Skip initial load
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const call = change.doc.data();
          if (call.status === 'active') {
            playSound();
            if (locationRef.current !== '/admin/calls') {
              setBlinkCall(true);
            }
            toast(`Kellner-Ruf (Tisch ${call.table})`, {
              icon: '🔔',
              duration: 8000,
              style: {
                background: '#222',
                color: '#fff',
                border: '1px solid #ef4444'
              }
            });
          }
        }
      });
    });

    // Set initial load to false after a short delay
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 1000);

    return () => {
      unsubOrders();
      unsubCalls();
      clearTimeout(timer);
    };
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Erfolgreich eingeloggt');
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Login');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
      toast('Erfolgreich abgemeldet', { icon: '👋' });
    } catch (error) {
      console.error(error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans text-gray-900 dark:text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans text-gray-900 dark:text-white">
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">Bitte melden Sie sich an, um auf das Admin-Panel zuzugreifen.</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Mit Google anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-white/10 flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-500 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Restaurant Management</p>
          </div>
          <ThemeToggle />
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavLink to="/admin" end className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <LayoutDashboard size={20} className={blinkOrder ? "animate-pulse text-red-400" : ""} />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink to="/admin/menu" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <UtensilsCrossed size={20} />
            <span className="font-medium">Speisekarte</span>
          </NavLink>
          <NavLink to="/admin/tables" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <QrCode size={20} />
            <span className="font-medium">Tische & QR</span>
          </NavLink>
          <NavLink to="/admin/calls" className={({isActive}) => `flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <div className="flex items-center gap-3">
              <Bell size={20} className={blinkCall ? "animate-pulse text-red-400" : ""} />
              <span className="font-medium">Kellner Rufe</span>
            </div>
            {activeCalls > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeCalls}
              </span>
            )}
          </NavLink>
          <NavLink to="/admin/history" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <History size={20} />
            <span className="font-medium">Verlauf</span>
          </NavLink>
          <NavLink to="/admin/finance" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
            <LineChart size={20} />
            <span className="font-medium">Finanzen</span>
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-white/5 hover:text-gray-900 dark:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Abmelden</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
