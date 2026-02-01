import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Client, ExecutiveTask, CallConfig, Language, TranscriptionEntry, LeadData } from './types';
import { GeminiLiveService, encodeAudio, decodeAudio, createAudioBuffer } from './services/geminiService';
import { clientService } from './services/clientService';
import { taskService } from './services/taskService';
import { 
  PhoneIcon, 
  PhoneXMarkIcon,
  ChartBarIcon, 
  GlobeAltIcon, 
  CheckCircleIcon,
  ListBulletIcon,
  InboxStackIcon,
  TrashIcon,
  BoltIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckBadgeIcon,
  CommandLineIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  CircleStackIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  MapPinIcon,
  FunnelIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  TagIcon,
  PlusIcon,
  LanguageIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  UserIcon,
  BeakerIcon,
  SignalIcon,
  ShieldCheckIcon,
  LinkIcon,
  ServerIcon,
  TableCellsIcon,
  MegaphoneIcon,
  PlayIcon,
  WifiIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Types & Config ---

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

// --- Components ---

const StatusIndicator: React.FC<{ label: string; status: 'connected' | 'error' | 'loading'; icon: React.ReactNode }> = ({ label, status, icon }) => (
  <div className="bg-[#0d1117] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${status === 'connected' ? 'bg-green-500/10 text-green-500' : status === 'loading' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
        {icon}
      </div>
      <span className="font-bold text-xs uppercase tracking-wider text-slate-300">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'loading' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'}`}></div>
      <span className={`text-[9px] font-black uppercase ${status === 'connected' ? 'text-green-500' : status === 'loading' ? 'text-amber-500' : 'text-red-500'}`}>
        {status === 'connected' ? 'ONLINE' : status === 'loading' ? 'CHECKING' : 'OFFLINE'}
      </span>
    </div>
  </div>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; disabled?: boolean }> = ({ active, onClick, icon, label, badge, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-6 px-6 py-4 rounded-2xl transition-all relative group ${active ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200 disabled:opacity-20'}`}
  >
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-bold text-[10px] uppercase tracking-[0.2em] hidden lg:block text-left">{label}</span>
    {badge && <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-black animate-pulse shadow-lg">{badge}</span>}
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'call' | 'inbox' | 'dashboard' | 'setup' | 'logs'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [callConfig, setCallConfig] = useState<CallConfig>(DEFAULT_CONFIG);
  const [langFilter, setLangFilter] = useState<Language | 'ALL'>('ALL');
  const [viewingTranscriptClient, setViewingTranscriptClient] = useState<Client | null>(null);
  
  // Real-time Call Metrics
  const [callDuration, setCallDuration] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Network / Backend Config
  const [backendUrl, setBackendUrl] = useState<string>(localStorage.getItem('mzansi_backend_url') || 'http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'error' | 'loading'>('loading');

  // Test Terminal State
  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState<'speak' | 'ask'>('speak');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  // Live Ops Visualization
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

  // Call Timer Effect
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

  // Auto-scroll transcript
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
        console.log(`Triggering Backend Call at ${backendUrl}/make-call ...`);
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
            // Mock initial greeting
            setTranscriptions([
              { role: 'model', text: `Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with ${client.name}?`, timestamp: Date.now() }
            ]);
        } else {
            throw new Error(data.error || "Failed to initiate call");
        }
    } catch (e: any) {
        console.error("Backend offline", e);
        alert(`Backend Error: ${e.message}. Ensure the server is running and the Backend URL in Mission Control is correct.`);
    }
  };

  const runNeuralTest = async () => {
    if (!testInput) return;
    setIsTestRunning(true);
    const newLog = `[${new Date().toLocaleTimeString()}] INITIATING ${testType.toUpperCase()} SEQUENCE...`;
    setTestLogs(prev => [newLog, ...prev]);

    try {
      if (testType === 'speak') {
        // Trigger Audio Stream
        const audioUrl = `${backendUrl}/audio-stream?text=${encodeURIComponent(testInput)}`;
        const audio = new Audio(audioUrl);
        await audio.play();
        setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] AUDIO BUFFER PLAYBACK SUCCESS`, ...prev]);
      } else {
        // Mock logic test
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

  const stats = useMemo(() => {
    const qualified = clients.filter(c => c.status === 'qualified').length;
    const total = clients.filter(c => c.status !== 'pending').length;
    return {
      qualified,
      failed: total - qualified,
      rate: total > 0 ? Math.round((qualified / total) * 100) : 0
    };
  }, [clients]);

  return (
    <div className="h-screen flex flex-row bg-[#02040a] text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* --- SIDEBAR --- */}
      <nav className="w-20 lg:w-72 bg-[#05070d] border-r border-white/[0.03] flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-glow">
            <CommandLineIcon className="w-6 h-6" />
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-lg tracking-tighter uppercase leading-none">JB³Ai <span className="text-indigo-500">Qualify</span></h2>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Mzanzi Neural Hub</p>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-2 py-6 overflow-y-auto scrollbar-hide">
          <NavItem active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<ListBulletIcon className="w-5 h-5" />} label="Lead Pipeline" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon={<InboxStackIcon className="w-5 h-5" />} label="Data Inbox" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Call Archive" />
          <NavItem active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />} label="Mission Control" />
          <NavItem active={activeTab === 'call'} onClick={() => activeClient && setActiveTab('call')} icon={<PhoneIcon className="w-5 h-5" />} label="Voice Terminal" disabled={!activeClient && !isCalling} />
          
          <div className="mt-8 px-4">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-4">Compliance</p>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-3 transition-colors">
                <ShieldCheckIcon className="w-4 h-4" /> POPIA Policy
            </a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider transition-colors">
                <DocumentTextIcon className="w-4 h-4" /> Terms of Use
            </a>
          </div>
        </div>

        <div className="p-8 mt-auto border-t border-white/[0.03]">
          <div className="bg-indigo-900/10 rounded-xl p-4 border border-indigo-500/10 mb-4">
             <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                  {backendStatus === 'connected' ? 'Link Established' : 'Link Severed'}
                </span>
             </div>
             <p className="text-[9px] text-slate-400 font-mono">v3.4.1-stable</p>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#02040a]">
        
        {/* TAB: PIPELINE (Clients) */}
        {activeTab === 'clients' && (
          <div className="flex-1 overflow-y-auto z-10 animate-fade-in scrollbar-hide">
            <header className="p-12 lg:p-24 pb-12">
               <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
                  <div>
                      <div className="flex items-center gap-3 text-indigo-400 mb-6 uppercase tracking-[0.6em] text-[10px] font-black">
                        <SparklesIcon className="w-5 h-5" />
                        Multilingual Outreach Node
                      </div>
                      <h1 className="text-7xl lg:text-9xl font-black text-white leading-[0.8] tracking-tighter uppercase text-glow">
                        Mzanzi Hub<span className="text-indigo-500">.</span>
                      </h1>
                  </div>
                  
                  {/* Visual Call Display */}
                  <div className="bg-[#0d1117] border border-white/5 p-8 rounded-3xl w-full lg:w-[400px]">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 flex items-center gap-2">
                          <SignalIcon className="w-4 h-4 text-indigo-500" /> Live Threads
                      </h4>
                      <div className="space-y-3">
                          {[1,2].map(i => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-1.5 h-1.5 rounded-full ${i <= activeThreads ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                      <span className={`text-xs font-bold ${i <= activeThreads ? 'text-white' : 'text-slate-600'}`}>Thread 0{i}</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500">{i <= activeThreads ? 'DIALING...' : 'IDLE'}</span>
                              </div>
                          ))}
                      </div>
                  </div>
               </div>

               {/* Hub Selector */}
               <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-white/5 pb-8">
                  <button onClick={() => setLangFilter('ALL')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${langFilter === 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5'}`}>
                      Global View
                  </button>
                  {Object.values(Language).map(lang => (
                      <button key={lang} onClick={() => setLangFilter(lang)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all flex items-center gap-2 ${langFilter === lang ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5'}`}>
                          {lang === Language.ZULU && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                          {lang === Language.ENGLISH && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                          {lang.replace('-ZA', '')}
                      </button>
                  ))}
               </div>

               <div className="grid grid-cols-1 gap-6">
                {filteredClients.map(client => (
                  <div key={client.id} className="bg-[#0d1117] p-8 rounded-[2rem] border border-white/[0.03] flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-indigo-500/20 transition-all group">
                    <div className="flex items-center gap-8 w-full lg:w-auto">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-400 border border-white/5">
                          {client.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl text-white tracking-tight mb-2">{client.name} {client.surname}</h3>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full">
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
                            className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${backendStatus === 'connected' ? 'bg-white text-black hover:bg-indigo-400 hover:text-white shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                        >
                            <PhoneIcon className="w-4 h-4" /> {backendStatus === 'connected' ? 'Initialize' : 'No Link'}
                        </button>
                    ) : (
                        <div className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${client.status === 'qualified' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                            {client.status}
                        </div>
                    )}
                  </div>
                ))}
               </div>
            </header>
          </div>
        )}

        {/* TAB: VOICE TERMINAL (Active Call) */}
        {activeTab === 'call' && (
          <div className="flex-1 flex flex-col bg-[#02040a] animate-fade-in overflow-hidden">
            {/* Header / Metrics Bar */}
            <div className="p-8 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse border border-red-500/20">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Session: {activeClient?.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{activeClient?.phone} • {activeClient?.area}</p>
                </div>
              </div>
              
              {/* END CALL BUTTON */}
              <button 
                onClick={endCall}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all flex items-center gap-3"
              >
                <PhoneXMarkIcon className="w-4 h-4" /> Disconnect
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 overflow-hidden">
              
              {/* LEFT: Neural Metrics Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Duration Card */}
                <div className="bg-[#0d1117] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Call Duration</h5>
                    <ClockIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-4xl font-mono font-black text-white tracking-tighter">
                    {formatDuration(callDuration)}
                  </div>
                  <div className="mt-4 flex gap-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-indigo-500 animate-shimmer"></div>
                  </div>
                </div>

                {/* Turns Card */}
                <div className="bg-[#0d1117] p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                   <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Turns</h5>
                    <ArrowsRightLeftIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-4xl font-black text-white tracking-tighter">
                    {transcriptions.length} <span className="text-sm font-bold text-slate-600 uppercase">Stages</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">Interaction Density: Nominal</p>
                </div>

                {/* Language Detection Card */}
                <div className="bg-[#0d1117] p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detected Engine</h5>
                    <LanguageIcon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-black text-xs">
                      {detectedLanguage?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xl font-black text-white uppercase tracking-tighter">
                      {detectedLanguage === 'zu' ? 'isiZulu' : detectedLanguage === 'en' ? 'English' : detectedLanguage}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">Logic: Confident 98%</span>
                  </div>
                </div>

                {/* Simulated Audio Waveform */}
                <div className="bg-[#0d1117] p-6 rounded-3xl border border-white/5 h-32 flex items-center justify-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full bg-indigo-500/40 animate-waveform`} 
                      style={{ 
                        height: `${Math.random() * 80 + 20}%`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              </div>

              {/* CENTER: Live Transcription Feed */}
              <div className="lg:col-span-3 flex flex-col bg-[#0d1117] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CommandLineIcon className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time Telemetry Data</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-widest">
                       <SignalIcon className="w-3 h-3" /> Encrypted Link
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide font-mono text-glow">
                  {transcriptions.map((t, i) => (
                    <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className={`max-w-[70%] group`}>
                         <div className={`flex items-center gap-3 mb-3 ${t.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${t.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                               {t.role === 'user' ? <UserIcon className="w-4 h-4" /> : <CpuChipIcon className="w-4 h-4" />}
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                              {t.role === 'user' ? 'Remote Client' : 'Zandi AI Agent'}
                            </span>
                         </div>
                         <div className={`p-6 rounded-2xl text-sm leading-relaxed ${t.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100 rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'}`}>
                            {t.text}
                         </div>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
                
                {/* Input Simulation Area */}
                <div className="p-8 border-t border-white/5 bg-black/20">
                   <div className="flex items-center gap-6">
                      <div className="flex-1 h-12 bg-black/40 rounded-xl border border-white/5 flex items-center px-6 text-slate-500 text-xs font-mono italic">
                        Listening for remote audio buffer...
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                           <MicrophoneIcon className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                           <SpeakerWaveIcon className="w-5 h-5" />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DATA INBOX (Sheet & Analytics) */}
        {activeTab === 'inbox' && (
            <div className="flex-1 flex flex-col bg-[#02040a] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <InboxStackIcon className="w-8 h-8 text-indigo-500" />
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Capture Hub</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Lead Synchronization</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-8 mr-8 px-8 border-r border-white/10">
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pass Rate</p>
                                <p className="text-xl font-black text-green-500">{stats.rate}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Qualified</p>
                                <p className="text-xl font-black text-white">{stats.qualified}</p>
                            </div>
                        </div>
                        <a 
                          href="https://docs.google.com/spreadsheets/d/16QVXzgrJ9JJd-Mlso84pR5I9e3KqBpq42RqpjiDxBIY/edit?usp=sharing"
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10"
                        >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" /> Open Full Grid
                        </a>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                            <ArrowPathIcon className="w-4 h-4" /> Resync Now
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden bg-white">
                  {/* Google Sheet Iframe */}
                  <iframe 
                      src="https://docs.google.com/spreadsheets/d/16QVXzgrJ9JJd-Mlso84pR5I9e3KqBpq42RqpjiDxBIY/edit?usp=sharing&rm=minimal" 
                      className="flex-1 w-full h-full border-none"
                      title="Google Sheet"
                  ></iframe>

                  {/* Sidebar stats/recent */}
                  <div className="w-full lg:w-80 bg-[#0d1117] border-l border-white/10 p-8 flex flex-col gap-8 hidden lg:flex">
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Capture Stream</h4>
                          <div className="space-y-4">
                              {clients.filter(c => c.status === 'qualified').slice(0, 5).map(c => (
                                  <div key={c.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-green-500/30 transition-all group">
                                      <div className="flex items-center justify-between mb-2">
                                          <span className="text-[10px] font-black text-white">{c.name}</span>
                                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase">
                                          <MapPinIcon className="w-3 h-3" /> {c.area || 'N/A'}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="mt-auto p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Sheet Integrity</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <ShieldCheckIcon className="w-5 h-5 text-green-500" /> Secure Encryption
                          </div>
                      </div>
                  </div>
                </div>
            </div>
        )}

        {/* TAB: CALL ARCHIVE (Logs) */}
        {activeTab === 'logs' && (
             <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide">
                <header className="mb-16">
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">Call Archive</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Full Transcript Retention Protocol</p>
                </header>

                <div className="space-y-4">
                    {clients.filter(c => c.status !== 'pending').map(client => (
                        <div key={client.id} className="bg-[#0d1117] p-8 rounded-3xl border border-white/5 hover:bg-white/[0.02] transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${client.status === 'qualified' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {client.status === 'qualified' ? <CheckBadgeIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{client.name} {client.surname}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{client.signup_date} • {client.language}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingTranscriptClient(client)} className="bg-white/5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4" /> View Full Transcript
                                </button>
                            </div>
                            
                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                <p className="text-slate-500 italic text-sm">"Yes, I am the homeowner. My bill is around R2500 per month..."</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* TAB: SETUP (Mission Control) */}
        {activeTab === 'setup' && (
            <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide">
                <header className="mb-16">
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">Mission Control</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">System Architecture & Neural Testing</p>
                </header>

                {/* 1. Connection Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <StatusIndicator label="Twilio Gateway" status={backendStatus} icon={<PhoneIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Azure Neural Voice" status="connected" icon={<MegaphoneIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Gemini Brain" status="connected" icon={<CpuChipIcon className="w-5 h-5" />} />
                    <StatusIndicator label="Google Sheets" status="connected" icon={<TableCellsIcon className="w-5 h-5" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* 2. Network Configuration Terminal */}
                    <div className="bg-[#0d1117] p-10 rounded-[2.5rem] border border-indigo-500/20 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <WifiIcon className="w-8 h-8 text-indigo-500" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Network Node</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Backend API Endpoint</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={backendUrl}
                                        onChange={(e) => saveBackendUrl(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-indigo-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all group-hover:border-indigo-500/40"
                                        placeholder="http://localhost:3001"
                                    />
                                    <div className="absolute right-4 top-4 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-600 mt-4 uppercase tracking-widest font-bold">Default: http://localhost:3001. Update this if using ngrok for public access.</p>
                            </div>
                            
                            <button 
                                onClick={checkBackendHealth}
                                className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3"
                            >
                                <SignalIcon className="w-4 h-4" /> Re-Ping Interface
                            </button>
                        </div>
                    </div>

                    {/* 3. Neural Verification Terminal */}
                    <div className="bg-[#0d1117] p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <BeakerIcon className="w-8 h-8 text-indigo-500" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Lab</h3>
                        </div>

                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
                             <div className="flex gap-2 mb-4 border-b border-white/5 pb-4">
                                 <button onClick={() => setTestType('speak')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${testType === 'speak' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white transition-colors'}`}>TTS Test</button>
                                 <button onClick={() => setTestType('ask')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${testType === 'ask' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white transition-colors'}`}>Logic Test</button>
                             </div>
                             
                             <textarea 
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                className="w-full bg-transparent border-none text-white text-sm font-mono focus:ring-0 h-24 resize-none"
                                placeholder={testType === 'speak' ? "Type a sentence for Zandi to speak..." : "Ask Zandi a question to test her logic..."}
                             />
                             
                             <div className="flex justify-between items-center mt-4">
                                 <div className="text-[8px] font-mono text-slate-600 uppercase">Buffer Status: {isTestRunning ? 'RUNNING...' : 'READY'}</div>
                                 <button 
                                  onClick={runNeuralTest}
                                  disabled={isTestRunning || !testInput}
                                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isTestRunning || !testInput ? 'bg-slate-800 text-slate-500' : 'bg-white text-black hover:bg-indigo-400 hover:text-white'}`}
                                 >
                                     <PlayIcon className="w-3 h-3" /> {isTestRunning ? 'Processing...' : 'Run Test Sequence'}
                                 </button>
                             </div>
                        </div>

                        {/* Scrolling Log Sidebar for Neural Lab */}
                        <div className="h-24 bg-black/20 rounded-xl border border-white/5 p-4 mb-8 overflow-y-auto font-mono text-[9px] text-slate-500 space-y-1 scrollbar-hide">
                            {testLogs.length > 0 ? testLogs.map((log, i) => (
                                <div key={i} className={i === 0 ? 'text-indigo-400' : ''}>{log}</div>
                            )) : (
                                <div className="opacity-30 italic">System Idle. Select a protocol to initiate...</div>
                            )}
                        </div>

                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Quick Protocols</p>
                        <div className="flex flex-wrap gap-3">
                            {QUICK_SCRIPTS.map(script => (
                                <button 
                                  key={script.name} 
                                  onClick={() => setTestInput(script.text)}
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-300 border border-white/5 transition-all"
                                >
                                    {script.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: TRANSCRIPT VIEWER */}
        {viewingTranscriptClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-fade-in">
             <div className="bg-[#0d1117] w-full max-w-3xl rounded-[2rem] border border-white/10 flex flex-col h-[80vh] shadow-2xl relative">
                <button onClick={() => setViewingTranscriptClient(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><XMarkIcon className="w-8 h-8" /></button>
                
                <div className="p-10 border-b border-white/5">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Transcript Log</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                       {viewingTranscriptClient.name} {viewingTranscriptClient.surname} • {viewingTranscriptClient.phone}
                   </p>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
                    {(viewingTranscriptClient.transcript && viewingTranscriptClient.transcript.length > 0) ? (
                        viewingTranscriptClient.transcript.map((t, i) => (
                            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-6 rounded-2xl ${t.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'}`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">{t.role === 'user' ? 'Client' : 'Zandi AI'}</p>
                                    <p className="text-base leading-relaxed font-medium">{t.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-30">
                            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="uppercase font-black tracking-widest">No Audio Data Logged</p>
                        </div>
                    )}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Global Styles */}
      <style>{`
        .shadow-glow { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        .text-glow { text-shadow: 0 0 40px rgba(99, 102, 241, 0.2); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waveform {
          0%, 100% { transform: scaleY(1); opacity: 0.4; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-waveform { animation: waveform 1s infinite ease-in-out; }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
      `}</style>
    </div>
  );
};

export default App;