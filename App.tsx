import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Client, CallConfig, Language, TranscriptionEntry } from './types';
import { clientService } from './services/clientService';
import { 
  PhoneIcon, 
  PhoneXMarkIcon,
  GlobeAltIcon, 
  ListBulletIcon,
  InboxStackIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  CheckBadgeIcon,
  CommandLineIcon,
  XMarkIcon,
  LanguageIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  BeakerIcon,
  SignalIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  MegaphoneIcon,
  PlayIcon,
  WifiIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  ScaleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid';

const DEFAULT_CONFIG: CallConfig = {
  companyName: "Mzansi Enterprise",
  objectives: "Verify lead contact information, confirm marketing consent, and gauge employment status.",
  parameters: ["Email Address", "Phone Number", "Employment Status", "Residential Area"],
  enabledLanguages: [Language.ENGLISH, Language.ZULU, Language.XHOSA, Language.AFRIKAANS, Language.SEPEDI],
  defaultLanguage: Language.ENGLISH
};

const QUICK_SCRIPTS = [
  { name: 'Greeting Protocol', text: "Sawubona! This is Zandi from Mzansi Solutions. I'm calling about your recent interest in our services. Am I speaking with the homeowner?" },
  { name: 'Objection Handling', text: "I understand you're busy. This will only take 60 seconds to verify your details and ensure you get the best rate. Is that alright?" },
  { name: 'Closing Statement', text: "Perfect, everything looks verified. We'll send the confirmation to your email shortly. Have a wonderful day further!" },
  { name: 'Zulu Switch', text: "Ngiyaxolisa, singakhuluma ngesiZulu uma uthanda? Sawubona, unjani?" }
];

const StatusIndicator: React.FC<{ label: string; status: 'connected' | 'error' | 'loading'; icon: React.ReactNode }> = ({ label, status, icon }) => (
  <div className="bg-[#121212] p-4 rounded-2xl border border-[#22324A]/30 flex items-center justify-between group hover:border-[#66FF66]/30 transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${status === 'connected' ? 'bg-[#66FF66]/10 text-[#66FF66]' : status === 'loading' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
        {icon}
      </div>
      <span className="font-bold text-xs uppercase tracking-wider text-slate-400">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-[#66FF66] animate-pulse' : status === 'loading' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`}></div>
      <span className={`text-[9px] font-black uppercase ${status === 'connected' ? 'text-[#66FF66]' : status === 'loading' ? 'text-amber-500' : 'text-red-500'}`}>
        {status === 'connected' ? 'ONLINE' : status === 'loading' ? 'CHECKING' : 'OFFLINE'}
      </span>
    </div>
  </div>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; disabled?: boolean }> = ({ active, onClick, icon, label, badge, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-6 px-6 py-4 rounded-2xl transition-all relative group ${active ? 'bg-[#66FF66] text-[#121212] shadow-[0_0_20px_rgba(102,255,102,0.3)]' : 'text-slate-500 hover:bg-[#22324A]/20 hover:text-[#66FF66] disabled:opacity-20'}`}
  >
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-bold text-[10px] uppercase tracking-[0.2em] hidden lg:block text-left">{label}</span>
    {badge && <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-black animate-pulse shadow-lg">{badge}</span>}
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'call' | 'inbox' | 'setup' | 'logs'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [langFilter, setLangFilter] = useState<Language | 'ALL'>('ALL');
  const [viewingTranscriptClient, setViewingTranscriptClient] = useState<Client | null>(null);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  
  const [callDuration, setCallDuration] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [backendUrl, setBackendUrl] = useState<string>(localStorage.getItem('mzansi_backend_url') || 'http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'error' | 'loading'>('loading');

  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState<'speak' | 'ask'>('speak');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  const [activeThreads, setActiveThreads] = useState<number>(0);

  useEffect(() => {
    setClients(clientService.getClients());
    checkBackendHealth();
    
    const interval = setInterval(() => {
      setActiveThreads(Math.floor(Math.random() * 3));
      checkBackendHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  useEffect(() => {
    let timer: number;
    if (isCalling) {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(backendUrl, { method: 'GET' });
      if (res.ok) setBackendStatus('connected');
      else setBackendStatus('error');
    } catch (e) {
      setBackendStatus('error');
    }
  };

  const handleStartCall = async (client: Client) => {
    try {
        const response = await fetch(`${backendUrl}/make-call`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: client.id })
        });
        
        const data = await response.json();
        if (data.success) {
            setActiveClient(client);
            setActiveTab('call');
            setIsCalling(true);
            setDetectedLanguage(client.language);
            setTranscriptions([
              { role: 'model', text: `Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with ${client.name}?`, timestamp: Date.now() }
            ]);
        } else {
            throw new Error(data.error || "Failed to initiate call");
        }
    } catch (e: any) {
        console.error("Backend offline", e);
        alert(`Backend Error: ${e.message}.`);
    }
  };

  const runNeuralTest = async () => {
    if (!testInput) return;
    setIsTestRunning(true);
    const newLog = `[${new Date().toLocaleTimeString()}] INITIATING ${testType.toUpperCase()} SEQUENCE...`;
    setTestLogs(prev => [newLog, ...prev]);

    try {
      if (testType === 'speak') {
        const audioUrl = `${backendUrl}/audio-stream?text=${encodeURIComponent(testInput)}`;
        const audio = new Audio(audioUrl);
        await audio.play();
        setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] AUDIO BUFFER PLAYBACK SUCCESS`, ...prev]);
      } else {
        await new Promise(r => setTimeout(r, 1500));
        setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] NEURAL RESPONSE: Confirmed. Information captured successfully.`, ...prev]);
      }
    } catch (err: any) {
      setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`, ...prev]);
    } finally {
      setIsTestRunning(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveBackendUrl = (url: string) => {
    setBackendUrl(url);
    localStorage.setItem('mzansi_backend_url', url);
  };

  const filteredClients = useMemo(() => {
    if (langFilter === 'ALL') return clients;
    return clients.filter(c => c.language === langFilter);
  }, [clients, langFilter]);

  const endCall = () => {
    setIsCalling(false);
    setActiveClient(null);
    setActiveTab('clients');
    setTranscriptions([]);
  };

  const archiveClients = useMemo(() => {
    return clients.filter(c => c.status !== 'pending');
  }, [clients]);

  return (
    <div className="h-screen flex flex-row bg-[#0A0C10] text-slate-100 font-sans overflow-hidden selection:bg-[#66FF66]/30">
      
      {/* --- SIDEBAR --- */}
      <nav className="w-20 lg:w-72 bg-[#121212] border-r border-[#22324A]/30 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#66FF66] rounded-xl flex items-center justify-center text-[#121212] shadow-[0_0_15px_rgba(102,255,102,0.4)] transition-all hover:scale-105">
            <CommandLineIcon className="w-6 h-6" />
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-lg tracking-tighter uppercase leading-none">JB³Ai <span className="text-[#66FF66]">Qualify</span></h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Mzanzi Neural Hub</p>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-2 py-6 overflow-y-auto scrollbar-hide">
          <NavItem active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<ListBulletIcon className="w-5 h-5" />} label="Pipeline" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon={<InboxStackIcon className="w-5 h-5" />} label="Data Inbox" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Call Archive" />
          <NavItem active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />} label="Config" />
          <NavItem active={activeTab === 'call'} onClick={() => activeClient && setActiveTab('call')} icon={<PhoneIcon className="w-5 h-5" />} label="Live Terminal" disabled={!activeClient && !isCalling} />
          
          <div className="mt-8 px-4">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Security</p>
            <button 
              onClick={() => setShowPopiaModal(true)}
              className="flex items-center gap-3 text-slate-500 hover:text-[#66FF66] text-[10px] font-bold uppercase tracking-wider mb-3 transition-colors w-full text-left"
            >
                <ShieldCheckIcon className="w-4 h-4" /> POPIA Valid
            </button>
          </div>
        </div>

        <div className="p-8 mt-auto border-t border-[#22324A]/30">
          <div className="bg-[#22324A]/10 rounded-xl p-4 border border-[#22324A]/20 mb-4">
             <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${backendStatus === 'connected' ? 'bg-[#66FF66]' : 'bg-red-500'}`}></div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${backendStatus === 'connected' ? 'text-[#66FF66]' : 'text-red-500'}`}>
                  {backendStatus === 'connected' ? 'Uplink Established' : 'Uplink Severed'}
                </span>
             </div>
             <p className="text-[9px] text-slate-600 font-mono tracking-tighter">v3.4.1-stable-mzanzi</p>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TAB: PIPELINE */}
        {activeTab === 'clients' && (
          <div className="flex-1 overflow-y-auto z-10 animate-fade-in scrollbar-hide">
            <header className="p-12 lg:p-24 pb-12">
               <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
                  <div>
                      <div className="flex items-center gap-3 text-[#66FF66] mb-6 uppercase tracking-[0.6em] text-[10px] font-black">
                        <SparklesIcon className="w-5 h-5" />
                        Neural Outreach Node
                      </div>
                      <h1 className="text-7xl lg:text-9xl font-black text-white leading-[0.8] tracking-tighter uppercase text-glow">
                        Mzanzi Hub<span className="text-[#66FF66]">.</span>
                      </h1>
                  </div>
                  
                  <div className="bg-[#121212] border border-[#22324A]/40 p-8 rounded-3xl w-full lg:w-[400px]">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 flex items-center gap-2">
                          <SignalIcon className="w-4 h-4 text-[#66FF66]" /> System Telemetry
                      </h4>
                      <div className="space-y-3">
                          {[1,2].map(i => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-[#22324A]/20">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-1.5 h-1.5 rounded-full ${i <= activeThreads ? 'bg-[#66FF66] animate-pulse' : 'bg-slate-700'}`}></div>
                                      <span className={`text-xs font-bold ${i <= activeThreads ? 'text-white' : 'text-slate-600'}`}>Thread 0{i}</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500 uppercase">{i <= activeThreads ? 'Dialing...' : 'Idle'}</span>
                              </div>
                          ))}
                      </div>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#22324A]/30 pb-8">
                  <button onClick={() => setLangFilter('ALL')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${langFilter === 'ALL' ? 'bg-[#66FF66] border-[#66FF66] text-[#121212]' : 'bg-transparent border-transparent text-slate-500 hover:bg-[#66FF66]/10'}`}>
                      All Regions
                  </button>
                  {Object.values(Language).map(lang => (
                      <button key={lang} onClick={() => setLangFilter(lang)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 ${langFilter === lang ? 'bg-[#66FF66] border-[#66FF66] text-[#121212]' : 'bg-transparent border-transparent text-slate-500 hover:bg-[#66FF66]/10'}`}>
                          {lang.replace('-ZA', '')}
                      </button>
                  ))}
                  <button className="ml-auto px-6 py-3 rounded-xl bg-[#22324A] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#22324A]/80 transition-all">
                      <PlusIcon className="w-4 h-4" /> Import Leads
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-6">
                {filteredClients.map(client => (
                  <div key={client.id} className="bg-[#E6E6E6] p-8 rounded-[2rem] flex flex-col lg:flex-row items-center justify-between gap-8 hover:shadow-[0_0_40px_rgba(102,255,102,0.15)] transition-all group">
                    <div className="flex items-center gap-8 w-full lg:w-auto">
                      <div className="w-16 h-16 bg-[#121212] rounded-2xl flex items-center justify-center text-2xl font-black text-[#66FF66]">
                          {client.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl text-[#121212] tracking-tight mb-2">{client.name} {client.surname}</h3>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#22324A] bg-[#22324A]/10 px-3 py-1 rounded-full">
                              <GlobeAltIcon className="w-3 h-3" /> {client.language}
                          </span>
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                              <DevicePhoneMobileIcon className="w-3 h-3" /> {client.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    {client.status === 'pending' ? (
                        <button 
                            onClick={() => handleStartCall(client)} 
                            disabled={backendStatus !== 'connected'}
                            className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${backendStatus === 'connected' ? 'bg-[#121212] text-white hover:bg-[#66FF66] hover:text-[#121212] shadow-xl accent-glow' : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'}`}
                        >
                            <PhoneIcon className="w-4 h-4" /> {backendStatus === 'connected' ? 'Initialize Call' : 'Offline'}
                        </button>
                    ) : (
                        <div className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${client.status === 'qualified' ? 'border-[#66FF66] text-[#66FF66] bg-[#66FF66]/5' : 'border-red-600 text-red-600 bg-red-500/5'}`}>
                            {client.status}
                        </div>
                    )}
                  </div>
                ))}
               </div>
            </header>
          </div>
        )}

        {/* TAB: VOICE TERMINAL */}
        {activeTab === 'call' && (
          <div className="flex-1 flex flex-col animate-fade-in overflow-hidden">
            <div className="p-8 border-b border-[#22324A]/30 bg-[#121212]/80 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Dialing Node: {activeClient?.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{activeClient?.phone} • {activeClient?.area}</p>
                </div>
              </div>
              
              <button onClick={endCall} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <PhoneXMarkIcon className="w-4 h-4" /> Terminate Session
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 overflow-hidden">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#121212] p-6 rounded-3xl border border-[#22324A]/40 group hover:border-[#66FF66]/30 transition-all">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                    Call Duration <ClockIcon className="w-4 h-4 text-[#66FF66]" />
                  </h5>
                  <div className="text-4xl font-mono font-black text-[#66FF66] tracking-tighter text-glow">
                    {formatDuration(callDuration)}
                  </div>
                </div>

                <div className="bg-[#121212] p-6 rounded-3xl border border-[#22324A]/40">
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                    Interaction Flow <ArrowsRightLeftIcon className="w-4 h-4 text-[#66FF66]" />
                  </h5>
                  <div className="text-4xl font-black text-white tracking-tighter">
                    {transcriptions.length} <span className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Turns</span>
                  </div>
                </div>

                <div className="bg-[#121212] p-6 rounded-3xl border border-[#22324A]/40">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                    Detected Dialect <LanguageIcon className="w-4 h-4 text-[#66FF66]" />
                  </h5>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] font-black text-xs border border-[#66FF66]/20">
                      {detectedLanguage?.slice(0, 2).toUpperCase() || 'EN'}
                    </div>
                    <div className="text-xl font-black text-white uppercase tracking-tighter">
                      {detectedLanguage === 'zu' ? 'isiZulu' : detectedLanguage === 'en' ? 'English' : 'Auto-Sync'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212] p-6 rounded-3xl border border-[#22324A]/40 h-32 flex items-center justify-center gap-1 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 rounded-full bg-[#66FF66]/40 animate-waveform" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col bg-[#121212] rounded-[2.5rem] border border-[#22324A]/40 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-[#22324A]/30 bg-white/[0.01] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CommandLineIcon className="w-5 h-5 text-[#66FF66]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Encrypted Session Metadata</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide font-mono">
                  {transcriptions.map((t, i) => (
                    <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className="max-w-[70%]">
                         <div className={`flex items-center gap-3 mb-3 ${t.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${t.role === 'user' ? 'bg-[#66FF66] text-[#121212] shadow-lg' : 'bg-[#22324A]/40 text-slate-400 border border-[#22324A]/30'}`}>
                               {t.role === 'user' ? <UserIcon className="w-4 h-4" /> : <CpuChipIcon className="w-4 h-4" />}
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                              {t.role === 'user' ? 'Remote Stream' : 'Neural Core'}
                            </span>
                         </div>
                         <div className={`p-6 rounded-2xl text-sm leading-relaxed ${t.role === 'user' ? 'bg-[#66FF66]/10 border border-[#66FF66]/20 text-[#66FF66] rounded-tr-none' : 'bg-[#22324A]/20 border border-[#22324A]/30 text-slate-300 rounded-tl-none'}`}>
                            {t.text}
                         </div>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
                
                <div className="p-8 border-t border-[#22324A]/30 bg-black/10">
                   <div className="flex items-center gap-6">
                      <div className="flex-1 h-12 bg-black/40 rounded-xl border border-[#22324A]/30 flex items-center px-6 text-slate-600 text-xs font-mono italic">
                        Synchronizing duplex audio buffer...
                      </div>
                      <div className="flex items-center gap-3">
                        <MicrophoneIcon className="w-5 h-5 text-[#66FF66] animate-pulse" />
                        <SpeakerWaveIcon className="w-5 h-5 text-slate-500 opacity-50" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DATA INBOX */}
        {activeTab === 'inbox' && (
            <div className="flex-1 flex flex-col bg-white">
                <div className="h-16 bg-[#121212] border-b border-[#22324A]/40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <TableCellsIcon className="w-6 h-6 text-[#66FF66]" />
                        <span className="font-bold text-white tracking-tight uppercase text-xs tracking-widest">Neural Data Sink</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="https://docs.google.com/spreadsheets/d/16QVXzgrJ9JJd-Mlso84pR5I9e3KqBpq42RqpjiDxBIY/edit?usp=sharing" target="_blank" rel="noreferrer" className="bg-[#66FF66] text-[#121212] px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 accent-glow">
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" /> Full Repository
                        </a>
                    </div>
                </div>
                <iframe src="https://docs.google.com/spreadsheets/d/16QVXzgrJ9JJd-Mlso84pR5I9e3KqBpq42RqpjiDxBIY/edit?usp=sharing&rm=minimal" className="flex-1 w-full h-full border-none" title="Google Sheet" />
            </div>
        )}

        {/* TAB: CALL ARCHIVE */}
        {activeTab === 'logs' && (
             <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide">
                <header className="mb-16 border-b border-[#22324A]/30 pb-12">
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 text-glow">Audit Archive</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Full interaction history and transcript data</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {archiveClients.map(client => (
                        <div key={client.id} className="bg-[#E6E6E6] p-8 rounded-3xl flex flex-col justify-between hover:translate-y-[-4px] transition-all border border-transparent hover:border-[#66FF66]/20">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-2 rounded-lg ${client.status === 'qualified' ? 'bg-green-600/10 text-green-600' : 'bg-red-600/10 text-red-600'}`}>
                                        {client.status === 'qualified' ? <CheckBadgeIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{client.signup_date}</span>
                                </div>
                                <h3 className="text-xl font-black text-[#121212] mb-1">{client.name} {client.surname}</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">{client.language} Engine • {client.phone}</p>
                            </div>
                            <button onClick={() => setViewingTranscriptClient(client)} className="w-full bg-[#121212] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#66FF66] hover:text-[#121212] transition-all">
                                <DocumentTextIcon className="w-4 h-4" /> Analyze Transcript
                            </button>
                        </div>
                    ))}
                    {archiveClients.length === 0 && (
                      <div className="col-span-full py-32 text-center opacity-30">
                        <InboxStackIcon className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="uppercase font-black tracking-widest">Archive Void</h2>
                      </div>
                    )}
                </div>
             </div>
        )}

        {/* TAB: SETUP */}
        {activeTab === 'setup' && (
            <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide">
                <header className="mb-16">
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 text-glow">System Config</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Node configuration and neural stability testing</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <StatusIndicator label="Twilio Gateway" status={backendStatus} icon={<PhoneIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Azure Neural" status="connected" icon={<MegaphoneIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Gemini Core" status="connected" icon={<CpuChipIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Sheet Logic" status="connected" icon={<TableCellsIcon className="w-5 h-5" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-[#121212] p-10 rounded-[2.5rem] border border-[#22324A]/40">
                        <div className="flex items-center gap-4 mb-8">
                            <WifiIcon className="w-8 h-8 text-[#66FF66]" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Connectivity Matrix</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Backend API Endpoint</label>
                                <input type="text" value={backendUrl} onChange={(e) => saveBackendUrl(e.target.value)} className="w-full bg-black/40 border border-[#22324A]/40 rounded-xl px-6 py-4 text-[#66FF66] font-mono text-xs focus:ring-1 focus:ring-[#66FF66] outline-none transition-all" />
                            </div>
                            <button onClick={checkBackendHealth} className="w-full bg-[#66FF66] text-[#121212] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(102,255,102,0.3)]">
                                <SignalIcon className="w-4 h-4" /> Recalibrate Connection
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#121212] p-10 rounded-[2.5rem] border border-[#22324A]/40">
                        <div className="flex items-center gap-4 mb-8">
                            <BeakerIcon className="w-8 h-8 text-[#66FF66]" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Lab</h3>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-6 border border-[#22324A]/40 mb-6">
                             <div className="flex gap-2 mb-4">
                                 <button onClick={() => setTestType('speak')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${testType === 'speak' ? 'bg-[#66FF66] text-[#121212]' : 'text-slate-500 hover:text-slate-300'}`}>Audio Unit</button>
                                 <button onClick={() => setTestType('ask')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${testType === 'ask' ? 'bg-[#66FF66] text-[#121212]' : 'text-slate-500 hover:text-slate-300'}`}>Logic Unit</button>
                             </div>
                             <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} className="w-full bg-transparent border-none text-[#66FF66] text-sm font-mono focus:ring-0 h-24 resize-none" placeholder="Enter stimulus parameters..." />
                             <div className="flex justify-end mt-4">
                                 <button onClick={runNeuralTest} disabled={isTestRunning} className="bg-white text-black px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#66FF66] transition-all disabled:opacity-20">
                                     {isTestRunning ? 'Processing...' : 'Run Protocol'}
                                 </button>
                             </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_SCRIPTS.map(s => (
                                <button key={s.name} onClick={() => setTestInput(s.text)} className="px-3 py-1.5 bg-[#22324A]/10 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded border border-[#22324A]/30 hover:border-[#66FF66]/40 transition-all hover:text-white">
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: SESSION ANALYTICS */}
        {viewingTranscriptClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#0A0C10]/95 backdrop-blur-xl animate-fade-in">
             <div className="bg-[#121212] w-full max-w-3xl rounded-[2rem] border border-[#22324A]/40 flex flex-col h-[85vh] shadow-2xl relative">
                <button onClick={() => setViewingTranscriptClient(null)} className="absolute top-8 right-8 text-slate-500 hover:text-[#66FF66] transition-colors"><XMarkIcon className="w-8 h-8" /></button>
                <div className="p-12 border-b border-[#22324A]/30">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Session Audit</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">{viewingTranscriptClient.name} {viewingTranscriptClient.surname} • {viewingTranscriptClient.language.toUpperCase()}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-12 space-y-6 scrollbar-hide">
                    {viewingTranscriptClient.transcript?.map((t, i) => (
                        <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-6 rounded-2xl ${t.role === 'user' ? 'bg-[#66FF66]/5 text-[#66FF66] border border-[#66FF66]/20 shadow-lg shadow-[#66FF66]/5 rounded-tr-none' : 'bg-[#22324A]/20 text-slate-300 border border-[#22324A]/30 rounded-tl-none'}`}>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">{t.role === 'user' ? 'Remote Signal' : 'AI Node'}</p>
                                <p className="text-base leading-relaxed font-medium">{t.text}</p>
                            </div>
                        </div>
                    ))}
                    {!viewingTranscriptClient.transcript && <div className="text-center py-20 opacity-30 italic uppercase tracking-widest">No transcript data found</div>}
                </div>
                <div className="p-12 border-t border-[#22324A]/30 flex justify-end">
                   <button onClick={() => setViewingTranscriptClient(null)} className="bg-[#22324A] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#22324A]/80 transition-all">Close Log</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: POPIA POLICY */}
        {showPopiaModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-[#0A0C10]/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
             <div className="bg-[#121212] w-full max-w-4xl rounded-[2rem] border border-[#22324A]/40 flex flex-col shadow-2xl relative my-auto max-h-[90vh]">
                <button 
                  onClick={() => setShowPopiaModal(false)} 
                  className="absolute top-8 right-8 text-slate-500 hover:text-[#66FF66] transition-colors z-20"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
                
                <div className="p-12 border-b border-[#22324A]/30 shrink-0">
                   <div className="flex items-center gap-4 mb-4">
                      <ShieldCheckIcon className="w-10 h-10 text-[#66FF66]" />
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">POPIA Compliance Protocol</h2>
                   </div>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Protection of Personal Information Act, 2013 (South Africa)</p>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                    {/* Section 1: 8 Conditions */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <ScaleIcon className="w-6 h-6 text-[#66FF66]" />
                        <h3 className="text-xl font-black text-[#66FF66] uppercase tracking-widest">8 Conditions for Lawful Processing</h3>
                      </div>
                      <p className="text-slate-400 mb-8 font-medium">To comply with POPIA, every organisation (the "Responsible Party") must adhere to these core principles:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: "Accountability", text: "You must ensure that all processing conditions are met and take responsibility for compliance." },
                          { title: "Processing Limitation", text: "Personal information must be processed lawfully and in a reasonable manner that does not infringe on privacy." },
                          { title: "Purpose Specification", text: "Data must be collected for a specific, explicitly defined, and lawful purpose." },
                          { title: "Further Processing Limitation", text: "Any further use of the data must be compatible with the original purpose for which it was collected." },
                          { title: "Information Quality", text: "You must take reasonable steps to ensure that personal information is complete, accurate, and not misleading." },
                          { title: "Openness", text: "Data subjects must be aware that their information is being collected and understand the purpose (often via a Privacy Notice)." },
                          { title: "Security Safeguards", text: "You must implement technical and organisational measures to prevent loss, damage, or unauthorised access to data." },
                          { title: "Data Subject Participation", text: "Individuals have the right to access their information and request corrections or deletions." }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-[#22324A]/10 border border-[#22324A]/30 p-5 rounded-2xl">
                             <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2 flex items-center gap-2">
                               <span className="text-[#66FF66] font-mono">{idx + 1}.</span> {item.title}
                             </h4>
                             <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Section 2: Implementation Steps */}
                    <section className="bg-white/5 p-8 rounded-[2rem] border border-[#22324A]/30">
                      <div className="flex items-center gap-3 mb-6">
                        <AcademicCapIcon className="w-6 h-6 text-[#66FF66]" />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Practical Implementation Steps</h3>
                      </div>
                      <ul className="space-y-4">
                        {[
                          { title: "Appoint an Information Officer", desc: "Register a designated person with the Information Regulator to oversee compliance." },
                          { title: "Conduct a Data Audit", desc: "Identify what personal information you hold, where it comes from, and why you have it." },
                          { title: "Develop Policies", desc: "Create and maintain a POPI Policy and a PAIA Manual as required by law." },
                          { title: "Manage Direct Marketing", desc: "Ensure you have explicit consent (often using Form 4) before sending unsolicited electronic communications." },
                          { title: "Secure Third-Party Agreements", desc: "Ensure any \"Operators\" (service providers) you share data with also comply with POPIA standards." }
                        ].map((item, idx) => (
                          <li key={idx} className="flex gap-4 group">
                             <div className="shrink-0 w-8 h-8 rounded-lg bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] font-mono text-xs group-hover:bg-[#66FF66] group-hover:text-[#121212] transition-all">
                               0{idx + 1}
                             </div>
                             <div>
                                <h4 className="font-black text-white text-xs uppercase tracking-wider mb-1">{item.title}</h4>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                             </div>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Section 3: Key Definitions */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <InformationCircleIcon className="w-6 h-6 text-[#66FF66]" />
                        <h3 className="text-xl font-black text-[#66FF66] uppercase tracking-widest">Key Definitions</h3>
                      </div>
                      <div className="space-y-4">
                        {[
                          { term: "Personal Information", def: "Includes ID numbers, email addresses, physical addresses, and even \"special\" information like health or criminal records." },
                          { term: "Data Subject", def: "The person (or juristic entity like a company) to whom the information relates." },
                          { term: "Responsible Party", def: "The entity that determines why and how personal information is processed." }
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row gap-2 md:gap-6 border-b border-[#22324A]/20 pb-4">
                             <span className="font-black text-white text-[10px] uppercase tracking-widest w-48 shrink-0">{item.term}</span>
                             <p className="text-xs text-slate-500">{item.def}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <footer className="pt-8 border-t border-[#22324A]/20">
                       <p className="text-slate-600 text-[10px] leading-relaxed italic mb-4">
                         For detailed legal guidance, you can refer to the official POPI Act document or the Information Regulator’s Guidance Notes. Would you like a specific checklist for small businesses or more information on registering your Information Officer?
                       </p>
                       <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                          <ShieldExclamationIcon className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-red-500/80">
                            AI responses may include mistakes. For legal advice, consult a professional.
                          </p>
                       </div>
                    </footer>
                </div>
                <div className="p-12 border-t border-[#22324A]/30 flex justify-end shrink-0">
                   <button 
                     onClick={() => setShowPopiaModal(false)} 
                     className="bg-[#66FF66] text-[#121212] px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-[0_0_20px_rgba(102,255,102,0.4)] transition-all"
                   >
                     Acknowledge
                   </button>
                </div>
             </div>
          </div>
        )}

      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waveform {
          0%, 100% { transform: scaleY(1); opacity: 0.3; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-waveform { animation: waveform 0.7s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;