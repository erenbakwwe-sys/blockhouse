import React, { useState } from 'react';
import { Sparkles, Palette, Zap, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAITheme() {
  const [prompt, setPrompt] = useState('');
  const [activePreset, setActivePreset] = useState('theme-default');

  const triggerAIGenerateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Bitte geben Sie eine Beschreibung der Atmosphäre ein!');
      return;
    }

    // Assign custom styled palette simulating bespoke AI calculation
    const lower = prompt.toLowerCase();
    if (lower.includes('kaffee') || lower.includes('coffee') || lower.includes('holz')) {
      document.body.className = 'theme-coffee';
      setActivePreset('theme-coffee');
    } else if (lower.includes('meer') || lower.includes('beach') || lower.includes('blau')) {
      document.body.className = 'theme-beach';
      setActivePreset('theme-beach');
    } else if (lower.includes('pizza') || lower.includes('rot') || lower.includes('italienisch')) {
      document.body.className = 'theme-pizza';
      setActivePreset('theme-pizza');
    } else {
      document.body.className = 'theme-fine-dining';
      setActivePreset('theme-fine-dining');
    }

    toast.success('Bespoke AI-Theme erfolgreich erstellt!');
  };

  const setThemePreset = (preset: string) => {
    document.body.className = preset;
    setActivePreset(preset);
    toast.success('Design-Vorlage angewendet!');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-900 dark:text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">AI Theme & Atmosphäre Builder</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personalisieren Sie das Restaurant-Interface sofort mit künstlicher Intelligenz</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prompt Box */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <Sparkles className="text-purple-500" size={20} /> Design per Prompt
          </h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Beschreiben Sie die Stimmung Ihres Restaurants (z.B. "Retro-Luxus-italienisches Restaurant, gedimmtes Licht, Bordeaux-Töne" oder "Ein warmes, modernes Café der dritten Welle in Holztönen").
          </p>

          <form onSubmit={triggerAIGenerateTheme} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Beschreibung der Restaurant-Atmosphäre</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500 resize-none"
                placeholder="Z.B. Entwirf eine warme Fine-Dining-Atmosphäre mit gedimmtem Kerzenlicht und luxuriösen Golddetails..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-extrabold py-4 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <Zap size={16} /> ⚡ Bespoke-Theme generieren
            </button>
          </form>
        </div>

        {/* Presets */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <Palette className="text-red-500" size={20} /> Design-Vorlagen
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setThemePreset('theme-coffee')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                activePreset === 'theme-coffee' ? 'bg-[#d4a373]/10 border-[#d4a373] text-[#d4a373]' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-sm">☕ Coffee Shop</span>
              {activePreset === 'theme-coffee' && <Check size={16} />}
            </button>

            <button
              onClick={() => setThemePreset('theme-fine-dining')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                activePreset === 'theme-fine-dining' ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-sm">👑 Fine Dining</span>
              {activePreset === 'theme-fine-dining' && <Check size={16} />}
            </button>

            <button
              onClick={() => setThemePreset('theme-pizza')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                activePreset === 'theme-pizza' ? 'bg-[#e74c3c]/10 border-[#e74c3c] text-[#e74c3c]' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-sm">🍕 Pizzeria</span>
              {activePreset === 'theme-pizza' && <Check size={16} />}
            </button>

            <button
              onClick={() => setThemePreset('theme-beach')}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                activePreset === 'theme-beach' ? 'bg-[#00b4d8]/10 border-[#00b4d8] text-[#00b4d8]' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-sm">🌴 Beach Club</span>
              {activePreset === 'theme-beach' && <Check size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
