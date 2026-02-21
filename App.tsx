import { useState, useEffect } from 'react';
import {
  RefreshCw, Layout, List, FileText, ShieldCheck, Trash2, Clock,
  Globe, MessageCircle, Mail, FileSpreadsheet, Gift, Phone, Activity, Terminal, Database, Sliders, Settings, Zap
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showLegal, setShowLegal] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [language, setLanguage] = useState('en');
  const [testText, setTestText] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [systemStatus, setSystemStatus] = useState({ twilio: false, azure: false, gemini: false, google: false, sheet: false });

  // 1. DATA INBOX SYNC LOGIC
  const handleSync = async () => {
    // Note: This triggers the backend to read the SPECIFIC sheet ID 12bR...
    const res = await fetch('http://localhost:3001/api/clients/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceSheet: "EMBEDDED_HUB_SHEET" })
    });

    if (res.ok) {
      alert("HUB SYNC COMPLETE: Embedded sheet data pushed to Mzanzi List.");
      fetchClients();
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/clients');
      setClients(await res.json());
    } catch (e) { console.error("Neural Link Offline"); }
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1A2333] via-[#0B0F1A] to-[#05070A] font-inter text-[#E8EEF6]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Orbitron:wght@500;700;900&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .jb-glow { box-shadow: 0 0 20px rgba(57, 255, 136, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0B0F1A; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #39FF88; border-radius: 2px; }
      `}</style>

      {/* 🛡️ POPIA SECURITY GATE */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F1A]/95 backdrop-blur-md p-4">
          <div className="bg-[#1A2333] w-full max-w-2xl border border-[#39FF88]/30 rounded-[24px] p-8 jb-glow">
            <h2 className="font-orbitron text-xl text-[#39FF88] mb-6 tracking-widest text-center">POPIA COMPLIANCE PROTOCOL</h2>
            <div className="h-64 overflow-y-auto mb-8 pr-4 text-xs space-y-4 text-slate-400 font-mono scrollbar-thin">
              <p className="text-[#39FF88] font-bold">1. ACCOUNTABILITY</p>
              <p>The Responsible Party must ensure all 8 conditions for lawful processing are met.</p>
              <p className="text-[#39FF88] font-bold">2. PROCESSING LIMITATION</p>
              <p>Personal information must be processed lawfully and in a reasonable manner.</p>
              <p className="text-[#39FF88] font-bold">3. PURPOSE SPECIFICATION</p>
              <p>Data must be collected for a specific, explicitly defined, and lawful purpose.</p>
              <p className="text-[#39FF88] font-bold">4. FURTHER PROCESSING LIMITATION</p>
              <p>Further processing must be compatible with the original purpose of collection.</p>
              <p className="text-[#39FF88] font-bold">5. INFORMATION QUALITY</p>
              <p>Responsible party must ensure information is complete, accurate, not misleading and updated.</p>
              <p className="text-[#39FF88] font-bold">6. OPENNESS</p>
              <p>Documentation of all processing operations must be maintained. Data subject must be notified.</p>
              <p className="text-[#39FF88] font-bold">7. SECURITY SAFEGUARDS</p>
              <p>Must secure the integrity and confidentiality of personal information in possession.</p>
              <p className="text-[#39FF88] font-bold">8. DATA SUBJECT PARTICIPATION</p>
              <p>Data subject has the right to request access to and correction of their personal information.</p>
            </div>
            <button onClick={() => { setHasAgreed(true); setShowLegal(false); }} className="w-full py-4 bg-[#39FF88] text-[#0B0F1A] font-orbitron font-bold rounded-xl hover:opacity-90 uppercase tracking-widest">
              Initialize OS Protocol
            </button>
          </div>
        </div>
      )}

      {/* 🚀 MAIN INTERFACE */}
      <div className={`flex flex-1 ${!hasAgreed ? 'blur-xl pointer-events-none' : 'transition-all duration-700'}`}>
        {/* SIDEBAR - RESTRUCTURED TO 7 ZONES */}
        <div className="w-64 border-r border-white/5 p-6 flex flex-col backdrop-blur-sm bg-[#1A2333]/30">
          <div className="mb-10 group">
            <h1 className="text-3xl font-orbitron font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#39FF88] to-[#00D9FF]">JB³Ai</h1>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem icon={<Database size={16} />} label="DATA_INBOX" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
            <NavItem icon={<Activity size={16} />} label="PIPELINE" active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} />
            <NavItem icon={<FileText size={16} />} label="CALL_ARCHIVE" active={activeTab === 'archives'} onClick={() => setActiveTab('archives')} />
            <NavItem icon={<Terminal size={16} />} label="LIVE_TERMINAL" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<Zap size={16} />} label="RUN_PROTOCOL" active={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} />
            <NavItem icon={<Sliders size={16} />} label="CONFIG_HUB" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            <NavItem icon={<Settings size={16} />} label="BACKEND_SETTINGS" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="text-[10px] text-[#39FF88] font-orbitron tracking-widest mb-4">CONNECTIVITY_MATRIX</div>
            <StatusIndicator label="TWILIO_GATEWAY" status={systemStatus.twilio} />
            <StatusIndicator label="AZURE_NEURAL" status={systemStatus.azure} />
            <StatusIndicator label="GEMINI_CORE" status={systemStatus.gemini} />
            <StatusIndicator label="GOOGLE_ADC" status={systemStatus.google} />
          </div>
        </div>

        {/* 💻 MAIN CONTENT ZONE */}
        <div className="flex-1 p-8 overflow-hidden flex flex-col">

          {/* HYBRID DATA INBOX VIEW */}
          {activeTab === 'inbox' && (
            <div className="flex flex-col h-full gap-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h2 className="font-orbitron text-2xl tracking-tighter">DATA_INBOX</h2>
                <div className="flex gap-2">
                  <button onClick={handleSync} className="bg-[#39FF88] text-[#0B0F1A] px-4 py-2 rounded font-orbitron text-[10px] font-bold flex items-center gap-2"><RefreshCw size={14} /> SYNC_SIGNAL</button>
                  <button onClick={() => setClients([])} className="bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded font-orbitron text-[10px] font-bold"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* LEFT: LIVE SHEET EMBED */}
                <div className="col-span-8 bg-[#1A2333] rounded-[24px] border border-white/5 overflow-hidden">
                  <iframe src="https://docs.google.com/spreadsheets/d/12bRfRW-m0cjNjRP6NdIdNsIMFBhS9Lv50JrLlt5dO5g/preview" className="w-full h-full border-none opacity-80" />
                </div>

                {/* RIGHT: TACTICAL LIST */}
                <div className="col-span-4 bg-[#0B0F1A] rounded-[24px] border border-white/5 overflow-y-auto custom-scrollbar p-4">
                  <h3 className="font-orbitron text-[10px] text-[#39FF88] mb-4">LOADED_SIGNALS</h3>
                  {clients.length === 0 ? <div className="text-slate-600 text-xs font-mono">NEURAL LINK EMPTY...</div> : clients.map((c: any) => (
                    <div key={c.id} className="p-3 bg-white/5 rounded-xl mb-2 border border-white/5 flex justify-between items-center hover:border-[#39FF88]/30 transition group">
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#39FF88]">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                        {c.source && <div className="text-[8px] text-[#00D9FF] font-mono mt-1">{c.source}</div>}
                      </div>
                      <button className="text-[10px] font-orbitron text-[#39FF88] border border-[#39FF88]/20 px-2 py-1 rounded hover:bg-[#39FF88] hover:text-[#0B0F1A] transition">INIT</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {activeTab !== 'inbox' && (
            <div className="flex items-center justify-center h-full flex-col gap-4 text-slate-600 font-orbitron text-xs">
              <Activity size={48} className="animate-pulse opacity-50" />
              ZONE_{activeTab.toUpperCase()}_INITIALIZING...
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// 🧠 Sub-components for Clean Architecture
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full p-3 rounded-lg flex items-center gap-3 font-orbitron text-xs tracking-widest transition-all ${active ? 'bg-[#39FF88]/10 text-[#39FF88] border border-[#39FF88]/40 shadow-[0_0_15px_rgba(57,255,136,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}>
      {icon} {label}
    </button>
  );
}

function StatusIndicator({ label, status }: any) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono mb-2">
      <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-[#39FF88] animate-pulse shadow-[0_0_8px_#39FF88]' : 'bg-red-500/50'}`} /> {label}
    </div>
  );
}