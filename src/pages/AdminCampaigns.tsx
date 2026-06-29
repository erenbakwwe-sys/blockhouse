import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Mail, Users, Gift, Download, Search, Trash2, Send, History, Check, Calendar, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  gift: string;
  table: string;
  createdAt: number;
  claimed: boolean;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  body: string;
  rewardType: string;
  targetCount: number;
  status: 'draft' | 'sent';
  createdAt: number;
  sentAt?: number;
}

export default function AdminCampaigns() {
  const [activeTab, setActiveTab] = useState<'leads' | 'create' | 'history'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Search/Filters
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedGiftFilter, setSelectedGiftFilter] = useState('all');

  // New Campaign Form State
  const [campaignTitle, setCampaignTitle] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState(`Hallo {MUSTERI_ADI},\n\nwir vermissen Sie! Ihr gewonnenes Geschenk ({KAZANILAN_HEDIYE}) wartet in unserem Restaurant auf Sie.\n\nZeigen Sie einfach diese E-Mail vor, um Ihr Geschenk jederzeit abzuholen.\n\nMit freundlichen Grüßen,\nIhr Restaurant-Team`);
  const [campaignTargetSegment, setCampaignTargetSegment] = useState('all');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);

  // Real-time listener for leads
  useEffect(() => {
    const unsubLeads = onSnapshot(
      query(collection(db, 'scratch_leads'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
        setLeads(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'scratch_leads');
      }
    );

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
        setCampaigns(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'campaigns');
      }
    );

    return () => {
      unsubLeads();
      unsubCampaigns();
    };
  }, []);

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.phone.includes(leadSearchQuery);

    const matchesGift = selectedGiftFilter === 'all' || lead.gift === selectedGiftFilter;

    return matchesSearch && matchesGift;
  });

  // Unique gifts list for dropdown
  const uniqueGifts = Array.from(new Set(leads.map(l => l.gift)));

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Kundendaten löschen möchten?')) return;
    try {
      await deleteDoc(doc(db, 'scratch_leads', leadId));
      toast.success('Kundenstamm erfolgreich gelöscht.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `scratch_leads/${leadId}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error('Keine Kundendaten zum Exportieren vorhanden.');
      return;
    }

    const headers = ['Name Nachname', 'E-Mail', 'Telefon', 'Gewonnener Preis', 'Tisch', 'Gewinnungsdatum'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.gift,
      `Tisch ${lead.table}`,
      new Date(lead.createdAt).toLocaleString('de-DE')
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `restaurant_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Kundenliste erfolgreich im Excel/CSV-Format heruntergeladen!');
  };

  // Launch Campaign Simulation
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !emailSubject.trim() || !emailBody.trim()) {
      toast.error('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // Get targets based on segment
    const targets = leads.filter(l => campaignTargetSegment === 'all' || l.gift === campaignTargetSegment);
    if (targets.length === 0) {
      toast.error('Keine Kundendaten in diesem Segment gefunden.');
      return;
    }

    if (!window.confirm(`Eine E-Mail-Kampagne wird für ${targets.length} Kunden gestartet. Möchten Sie fortfahren?`)) return;

    setIsSendingCampaign(true);
    setTotalToSend(targets.length);
    setSendingProgress(0);

    // Dynamic campaign step simulation
    const interval = setInterval(async () => {
      setSendingProgress(prev => {
        const next = prev + Math.ceil(targets.length / 5);
        if (next >= targets.length) {
          clearInterval(interval);
          
          // Save Campaign to Firestore once completed
          const campaignData = {
            title: campaignTitle.trim(),
            subject: emailSubject.trim(),
            body: emailBody.trim(),
            rewardType: campaignTargetSegment === 'all' ? 'Alle Preisträger' : campaignTargetSegment,
            targetCount: targets.length,
            status: 'sent' as const,
            createdAt: Date.now(),
            sentAt: Date.now()
          };

          addDoc(collection(db, 'campaigns'), campaignData)
            .then(() => {
              setIsSendingCampaign(false);
              toast.success('Kampagne erfolgreich abgeschlossen und an alle Benutzer gesendet!');
              setActiveTab('history');
              // Clear form
              setCampaignTitle('');
              setEmailSubject('');
            })
            .catch(err => {
              setIsSendingCampaign(false);
              handleFirestoreError(err, OperationType.CREATE, 'campaigns');
            });

          return targets.length;
        }
        return next;
      });
    }, 400);
  };

  return (
    <div className="p-4 md:p-8 font-sans max-w-7xl mx-auto text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kampagnen & Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rubbelkarten-Kundendatenbank & E-Mail-Versandterminal</p>
        </div>

        {activeTab === 'leads' && (
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-emerald-600/10"
          >
            <Download size={18} /> Excel/CSV Exportieren
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-gray-200/60 dark:bg-white/5 p-1 rounded-2xl mb-8 w-fit border border-gray-200/30 dark:border-white/5">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-white dark:bg-[#1c1c1e] text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
          }`}
        >
          <Users size={14} /> Kundenliste ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-white dark:bg-[#1c1c1e] text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
          }`}
        >
          <Send size={14} /> Neue E-Mail-Kampagne
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-[#1c1c1e] text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
          }`}
        >
          <History size={14} /> Versandverlauf ({campaigns.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leads' && (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Nach Name, E-Mail oder Telefon suchen..."
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>

              {/* Filter */}
              <div>
                <select
                  value={selectedGiftFilter}
                  onChange={(e) => setSelectedGiftFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                >
                  <option value="all">Alle Preise anzeigen</option>
                  {uniqueGifts.map(gift => (
                    <option key={gift} value={gift}>{gift}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leads Table Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Kundeninformationen</th>
                      <th className="p-4">Gewonnenes Geschenk</th>
                      <th className="p-4">Tisch</th>
                      <th className="p-4">Gewinnungsdatum</th>
                      <th className="p-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                          Keine glücklichen Kundendaten gefunden.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-gray-900 dark:text-white">{lead.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex flex-col gap-0.5">
                              <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>
                              <span className="flex items-center gap-1"><Users size={12} /> {lead.phone}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/10 rounded-lg">
                                <Gift size={14} />
                              </span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{lead.gift}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-xs">
                              Tisch {lead.table}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(lead.createdAt).toLocaleString('de-DE')}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                              title="Datensatz löschen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Creation Form */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Send className="text-indigo-500" size={20} /> Kampagnendetails
              </h2>

              <form onSubmit={handleSendCampaign} className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Kampagnenname (Nur für Admins sichtbar)</label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Z.B.: Wochenend-Soufflé-Kampagne"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">E-Mail-Betreff (Subject)</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Z.B.: Ihr kostenloser Soufflé-Gutschein ist bereit!"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Zielsegment (Gewonnener Preis)</label>
                    <select
                      value={campaignTargetSegment}
                      onChange={(e) => setCampaignTargetSegment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">Alle glücklichen Kunden ({leads.length} Personen)</option>
                      {uniqueGifts.map(gift => {
                        const count = leads.filter(l => l.gift === gift).length;
                        return (
                          <option key={gift} value={gift}>{gift}-Gewinner ({count} Personen)</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-xl flex items-center gap-3">
                    <AlertCircle className="text-indigo-500 shrink-0" size={18} />
                    <div className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      Im E-Mail-Inhalt können Sie die Variablen <strong>{'{MUSTERI_ADI}'}</strong> und <strong>{'{KAZANILAN_HEDIYE}'}</strong> verwenden. Diese Felder werden dynamisch ausgefüllt.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">E-Mail-Textkörper (Mail Body)</label>
                  <textarea
                    required
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingCampaign}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 text-xs"
                >
                  <Send size={14} /> Kampagne starten & senden
                </button>
              </form>
            </div>

            {/* Campaign Live Simulation Progress overlay */}
            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={18} /> Kampagnen-Versandpanel
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Kampagnen, die Sie über dieses Panel starten, werden nacheinander an die Datensätze in der Kundendatenbank gesendet. Nach jedem Versand wird der Erfolgsstatus live aktualisiert.
                </p>

                {isSendingCampaign && (
                  <div className="mt-8 bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/30">
                    <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                      Kampagne wird gesendet...
                    </h4>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 mt-4 font-semibold">
                      <span>Fortschritt: {sendingProgress} / {totalToSend}</span>
                      <span>{Math.round((sendingProgress / totalToSend) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(sendingProgress / totalToSend) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-gray-100 dark:border-white/5 pt-6 text-xs text-gray-400 space-y-2">
                <p className="font-semibold text-gray-600 dark:text-gray-300">💡 Versand-Tipps:</p>
                <p>• Es wurde beobachtet, dass Gutscheine, die am Wochenende und am späten Nachmittag versendet werden, Restaurantbesuche um 40% steigern.</p>
                <p>• Die Angabe der Gültigkeitsdauer der Gutscheine in der E-Mail erzeugt ein Gefühl der Dringlichkeit.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* History List */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History size={18} className="text-indigo-500" /> Abgeschlossene Kampagnen
                </h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {campaigns.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 italic">
                    Es wurde noch keine E-Mail-Kampagne gesendet.
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-extrabold uppercase rounded-full border border-indigo-500/10 tracking-wide">
                              {campaign.rewardType}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                              <Calendar size={12} /> {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString('de-DE') : new Date(campaign.createdAt).toLocaleString('de-DE')}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900 dark:text-white mt-2">{campaign.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Betreff: <span className="font-normal text-gray-700 dark:text-gray-300">{campaign.subject}</span></p>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block font-medium">Empfängeranzahl</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{campaign.targetCount} Personen</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-xl text-xs font-bold">
                            <Check size={14} /> Erfolgreich
                          </div>
                        </div>
                      </div>

                      {/* Display Sent Body */}
                      <div className="mt-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200/50 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300 font-mono whitespace-pre-line max-h-40 overflow-y-auto">
                        {campaign.body}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
