import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, UtensilsCrossed, Bell, LogOut, History, Lock, LineChart } from 'lucide-react';
import { useStore, socket } from '../store/StoreContext';
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';

export default function AdminLayout() {
  const { calls } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activeCalls = calls.filter(c => c.status === 'active').length;

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('adminAuth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [blinkOrder, setBlinkOrder] = useState(false);
  const [blinkCall, setBlinkCall] = useState(false);
  const locationRef = useRef(location.pathname);

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

    const handleNewOrder = (order: any) => {
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
    };

    const handleNewCall = (call: any) => {
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
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('newCall', handleNewCall);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('newCall', handleNewCall);
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded credentials for prototype
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      toast.success('Erfolgreich eingeloggt');
    } else {
      toast.error('Falscher Benutzername oder Passwort');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    navigate('/admin');
    toast('Erfolgreich abgemeldet', { icon: '👋' });
  };

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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors mt-6"
            >
              Einloggen
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Demo-Zugang: admin / admin123</p>
          </div>
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
