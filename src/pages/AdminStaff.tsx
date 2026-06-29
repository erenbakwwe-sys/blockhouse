import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, UserMinus, Shield, Phone, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: string;
}

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff fields
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('Kellner');

  // Branch settings fields
  const [branchName, setBranchName] = useState('BLOCK HOUSE Berlin-Mitte');
  const [workingHours, setWorkingHours] = useState('11:30 - 23:00');
  const [branchPhone, setBranchPhone] = useState('+49 30 1234567');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
      setStaff(fetched);
    }, console.error);
    return () => unsub();
  }, []);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim() || !role.trim()) return;

    if (pin.length < 4) {
      toast.error('Die PIN muss mindestens 4 Ziffern enthalten.');
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), {
        name,
        pin,
        role
      });
      toast.success('Neuer Mitarbeiter hinzugefügt.');
      setIsModalOpen(false);
      setName('');
      setPin('');
      setRole('Kellner');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Hinzufügen des Mitarbeiters.');
    }
  };

  const deleteStaffMember = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter entfernen möchten?')) {
      try {
        await deleteDoc(doc(db, 'staff', id));
        toast.success('Mitarbeiter entfernt.');
      } catch (err) {
        console.error(err);
        toast.error('Löschen fehlgeschlagen.');
      }
    }
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Filialinformationen erfolgreich aktualisiert.');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Personal- & Filialverwaltung</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Konfigurieren Sie Mitarbeiter mit Systemzugriff und Filialregeln</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Users size={18} /> + Mitarbeiter hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staff List */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <span>👥</span> Aktives Personalteam
          </h2>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {staff.length === 0 ? (
              <p className="text-gray-400 italic text-center py-12 text-sm">Keine aktiven Mitarbeiter vorhanden.</p>
            ) : (
              staff.map(st => (
                <div key={st.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl flex justify-between items-center hover:scale-[1.01] transition-transform">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base">{st.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Rolle: <strong className="text-gray-700 dark:text-gray-200">{st.role}</strong></span>
                      <span>PIN: <strong className="font-mono bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-800 dark:text-white">{st.pin}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteStaffMember(st.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all cursor-pointer"
                    title="Mitarbeiter entfernen"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Branch Config */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <span>🏢</span> Filialkonfiguration
          </h2>
          <form onSubmit={handleBranchSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <MapPin size={16} /> Filialname
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Clock size={16} /> Arbeitszeiten
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Phone size={16} /> Kontakttelefon
              </label>
              <input
                type="text"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
                className="w-full bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl transition-all cursor-pointer text-sm"
            >
              Filialinformationen aktualisieren
            </button>
          </form>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a1a1a] p-8 max-w-md w-full rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Mitarbeiter zuweisen</h3>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Name Vorname</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">PIN-Code (4 Ziffern)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-red-500"
                  placeholder="1234"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Position / Rolle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="Kellner">Kellner</option>
                  <option value="Kassierer">Kassierer</option>
                  <option value="Küchenchef">Küchenchef</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex-1 transition-colors cursor-pointer text-sm"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-3 px-6 rounded-xl flex-1 transition-colors cursor-pointer text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
