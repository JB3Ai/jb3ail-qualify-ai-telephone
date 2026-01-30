
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language, LeadData, TranscriptionEntry, Client, ExecutiveTask, CallConfig } from './types';
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
  SignalIcon
} from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';

// --- Helper Components ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; disabled?: boolean }> = ({ active, onClick, icon, label, badge, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-6 px-6 py-5 rounded-2xl transition-all relative group ${active ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200 disabled:opacity-20'}`}
  >
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-bold text-[11px] uppercase tracking-[0.2em] hidden lg:block text-left">{label}</span>
    {badge && <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-black animate-pulse shadow-lg">{badge}</span>}
  </button>
);

const Badge: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-xl border border-white/[0.05]">
     {icon}
     {text}
  </span>
);

const DashboardMetric: React.FC<{ label: string; value: string; trend: string; trendUp: boolean; icon: React.ReactNode }> = ({ label, value, trend, trendUp, icon }) => (
  <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/[0.05] group shadow-2xl relative overflow-hidden transition-all hover:bg-white/[0.03]">
    <div className="flex items-center justify-between mb-8">
       <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">{icon}</div>
       <span className={`text-[10px] font-black px-3 py-1 rounded-full ${trendUp ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trend}
       </span>
    </div>
    <p className="text-6xl font-black text-white tracking-tighter leading-none mb-4">{value}</p>
    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
  </div>
);

const Footer: React.FC = () => (
  <footer className="mt-40 px-12 lg:px-24 py-20 bg-[#05070d] border-t border-white/[0.03] z-10 relative">
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24 mb-20">
      <div className="lg:col-span-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <CommandLineIcon className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-xl tracking-tighter uppercase leading-none text-white">JB³Ai <span className="text-indigo-500">Corp</span></h4>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Professional Intelligence</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium leading-relaxed opacity-60">
          The central operating layer for professional business intelligence and asset management.
        </p>
      </div>

      <div>
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Platform</h5>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">OS³ Dash</a></li>
        </ul>
      </div>

      <div>
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Resources</h5>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">Demo</a></li>
          <li><a href="#" className="text-sm font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">Contact</a></li>
        </ul>
      </div>

      <div>
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Legal</h5>
        <ul className="space-y-4">
          <li><a href="#" className="text-sm font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">Privacy</a></li>
          <li><a href="#" className="text-sm font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">Terms</a></li>
        </ul>
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto pt-10 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
          © 2026 JB³Ai Corporation • South Africa Branch • Managed Environment
        </p>
      </div>
      <div className="flex items-center gap-8">
        <Badge icon={<MapPinIcon className="w-3 h-3 text-indigo-500" />} text="Cape Town / JHB" />
        <Badge icon={<CheckBadgeIcon className="w-3 h-3 text-indigo-500" />} text="Verified Service Node" />
      </div>
    </div>
  </footer>
);

const DEFAULT_CONFIG: CallConfig = {
  companyName: "Mzansi Enterprise",
  objectives: "Verify lead contact information, confirm marketing consent, and gauge employment status.",
  parameters: ["Email Address", "Phone Number", "Employment Status", "Residential Area"],
  enabledLanguages: [Language.ENGLISH, Language.ZULU, Language.XHOSA, Language.AFRIKAANS, Language.SEPEDI],
  defaultLanguage: Language.ENGLISH
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'call' | 'inbox' | 'dashboard' | 'setup' | 'logs'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<ExecutiveTask[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [extractedData, setExtractedData] = useState<LeadData>({});
  const [viewingTranscriptClient, setViewingTranscriptClient] = useState<Client | null>(null);
  const [callStartTime, setCallStartTime] = useState<string | null>(null);
  const [callDate, setCallDate] = useState<string | null>(null);
  
  const [callConfig, setCallConfig] = useState<CallConfig>(() => {
    const saved = localStorage.getItem('jb3_call_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [newParam, setNewParam] = useState('');
  const [langFilter, setLangFilter] = useState<Language | 'ALL'>('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<'upload' | 'mapping'>('upload');
  const [isSyncing, setIsSyncing] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '', surname: '', phone: '', email: '', area: '', language: ''
  });
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const liveSessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const service = useMemo(() => new GeminiLiveService(), []);

  useEffect(() => {
    setClients(clientService.getClients());
    setTasks(taskService.getTasks());
  }, []);

  useEffect(() => {
    localStorage.setItem('jb3_call_config', JSON.stringify(callConfig));
  }, [callConfig]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions]);

  const filteredClients = useMemo(() => {
    if (langFilter === 'ALL') return clients;
    return clients.filter(c => c.language === langFilter);
  }, [clients, langFilter]);

  const handleStartCall = async (client: Client, overrideLang?: Language) => {
    try {
      const now = new Date();
      setActiveClient(client);
      setActiveTab('call');
      setIsCalling(true);
      setTranscriptions([]);
      setExtractedData({});
      setCallStartTime(now.toLocaleTimeString());
      setCallDate(now.toLocaleDateString());
      
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use a custom config if override language is provided
      const configToUse = overrideLang 
        ? { ...callConfig, defaultLanguage: overrideLang }
        : callConfig;

      const sessionPromise = service.connect({
        client,
        config: configToUse,
        onTranscription: (text, role) => {
          setTranscriptions(prev => {
            const entry: TranscriptionEntry = { text, role, timestamp: Date.now(), clientId: client.id };
            if (prev.length === 0) return [entry];
            const last = prev[prev.length - 1];
            if (last.role === role) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, text: last.text + text };
              return updated;
            }
            return [...prev, entry];
          });
        },
        onAudioData: async (base64) => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await createAudioBuffer(decodeAudio(base64), ctx);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.addEventListener('ended', () => sourcesRef.current.delete(source));
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
        },
        onInterrupted: () => {
          sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        },
        onTurnComplete: () => {},
        onError: (err) => console.error("Dialer Critical Error:", err)
      });

      liveSessionRef.current = await sessionPromise;

      const source = inputAudioCtxRef.current.createMediaStreamSource(streamRef.current);
      const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = encodeAudio(inputData);
        sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(processor);
      processor.connect(inputAudioCtxRef.current.destination);
    } catch (error) {
      console.error("Dialer Fail:", error);
      setIsCalling(false);
    }
  };

  const handleEndCall = async () => {
    // 1. Immediate UI update
    setIsCalling(false);
    
    // 2. Stop media tracks instantly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // 3. Disconnect script processor
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch(e) {}
      scriptProcessorRef.current = null;
    }

    // 4. Close Live session
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch(e) {}
      liveSessionRef.current = null;
    }

    // 5. Cleanup playback sources and reset audio contexts
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (inputAudioCtxRef.current) {
      try { await inputAudioCtxRef.current.close(); } catch(e) {}
      inputAudioCtxRef.current = null;
    }
    if (audioCtxRef.current) {
      try { await audioCtxRef.current.close(); } catch(e) {}
      audioCtxRef.current = null;
    }

    // 6. Finalize data and transcriptions
    const finalTranscript = [...transcriptions];
    const transcriptText = finalTranscript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');

    if (activeClient && !activeClient.id.startsWith('TEST-')) {
      try {
        const extraction = await service.extractLeadData(transcriptText, callConfig);
        clientService.updateClientStatus(activeClient.id, extraction.status, extraction.data, finalTranscript);
        setClients(clientService.getClients());
      } catch (err) {
        console.error("Post-call extraction failed:", err);
      }
    }
    
    setCallStartTime(null);
    setCallDate(null);
  };

  const handleTestCall = (lang: Language) => {
    const testClient: Client = {
      id: `TEST-${lang}-${Date.now()}`,
      name: "Neural",
      surname: "Subject",
      area: "Virtual Environment",
      phone: "INTERNAL-SYNC",
      signup_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      language: lang,
    };
    handleStartCall(testClient, lang);
  };

  const handleSyncDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const mockDBLeads: Omit<Client, 'status' | 'collected_data'>[] = [
        { 
          id: `DB-${Date.now()}`, 
          name: "Nelson", 
          surname: "Mandela",
          area: "Eastern Cape",
          phone: "+27112223333", 
          signup_date: new Date().toISOString().split('T')[0], 
          language: Language.XHOSA 
        }
      ];
      const updated = clientService.importClients(mockDBLeads);
      setClients(updated);
      setIsSyncing(false);
      setIsImportModalOpen(false);
    }, 2000);
  };

  const toggleLanguage = (lang: Language) => {
    setCallConfig(prev => ({
      ...prev,
      enabledLanguages: prev.enabledLanguages.includes(lang)
        ? prev.enabledLanguages.filter(l => l !== lang)
        : [...prev.enabledLanguages, lang]
    }));
  };

  const addParameter = (param?: string) => {
    const value = (param || newParam).trim();
    if (value && !callConfig.parameters.includes(value)) {
      setCallConfig(prev => ({ ...prev, parameters: [...prev.parameters, value] }));
      setNewParam('');
    }
  };

  const removeParameter = (p: string) => {
    setCallConfig(prev => ({ ...prev, parameters: prev.parameters.filter(item => item !== p) }));
  };

  const callArchive = useMemo(() => {
    return clients
      .filter(c => c.transcript && c.transcript.length > 0)
      .sort((a, b) => {
        const lastA = a.transcript?.[a.transcript.length - 1]?.timestamp || 0;
        const lastB = b.transcript?.[b.transcript.length - 1]?.timestamp || 0;
        return lastB - lastA;
      });
  }, [clients]);

  const reportsSummary = useMemo(() => {
    const totalCalls = clients.filter(c => c.status !== 'pending').length;
    const qualified = clients.filter(c => c.status === 'qualified').length;
    const rate = totalCalls > 0 ? (qualified / totalCalls) * 100 : 0;
    return {
      total: totalCalls,
      qualified: qualified,
      rate: rate.toFixed(1) + '%',
      languages: Object.values(Language).map(lang => ({
        name: lang,
        value: clients.filter(c => c.language === lang && c.status !== 'pending').length
      }))
    };
  }, [clients]);

  return (
    <div className="h-screen flex flex-row bg-[#02040a] text-slate-100 font-sans overflow-hidden">
      <nav className="w-20 lg:w-72 bg-[#05070d] border-r border-white/[0.03] flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <CommandLineIcon className="w-6 h-6" />
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-lg tracking-tighter uppercase leading-none">JB³Ai <span className="text-indigo-500">Qualify</span></h2>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Mzanzi Neural Hub</p>
          </div>
        </div>
        <div className="flex-1 px-4 space-y-2 py-6">
          <NavItem active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<ListBulletIcon className="w-5 h-5" />} label="Lead Pipeline" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon={<InboxStackIcon className="w-5 h-5" />} label="Review Queue" badge={tasks.length || undefined} />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Logs & Reports" />
          <NavItem active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<Cog6ToothIcon className="w-5 h-5" />} label="Mission Control" />
          <NavItem active={activeTab === 'call'} onClick={() => activeClient && setActiveTab('call')} icon={<PhoneIcon className="w-5 h-5" />} label="Voice Terminal" disabled={!activeClient && !isCalling} />
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<ChartBarIcon className="w-5 h-5" />} label="Market Intelligence" />
        </div>
        <div className="p-8 mt-auto border-t border-white/[0.03]">
          <button onClick={() => { clientService.reset(); setClients(clientService.getClients()); }} className="w-full flex items-center gap-3 text-slate-600 hover:text-red-400 transition-all font-bold text-[9px] uppercase tracking-[0.2em]">
            <TrashIcon className="w-4 h-4" />
            <span className="hidden lg:block">Wipe Session</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeTab === 'clients' && (
          <div className="flex-1 overflow-y-auto z-10 animate-fade-in scrollbar-hide">
            <div className="relative h-[55vh] w-full overflow-hidden bg-black flex flex-col justify-end p-12 lg:p-24">
               <div className="absolute inset-0 opacity-40">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                  <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover scale-110 blur-sm" alt="" />
               </div>
               <div className="relative z-20">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-8">
                    <div>
                      <div className="flex items-center gap-3 text-indigo-400 mb-6 uppercase tracking-[0.6em] text-[10px] font-black">
                        <SparklesIcon className="w-5 h-5" />
                        Multilingual Outreach Node V3.1
                      </div>
                      <h1 className="text-7xl lg:text-[10rem] font-black text-white leading-[0.75] tracking-tighter uppercase text-glow">
                        Mzanzi Neural Hub<span className="text-indigo-500">.</span>
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-start gap-8">
                    <div className="w-1.5 h-32 bg-indigo-600 rounded-full mt-2"></div>
                    <p className="text-slate-400 text-xl lg:text-3xl font-medium leading-relaxed max-w-2xl opacity-80">
                      JB³Ai Qualify engine verifying regional leads for <span className="text-indigo-400 font-black">{callConfig.companyName}</span> across multiple dialects.
                    </p>
                  </div>
               </div>
            </div>
            <div className="px-12 lg:px-24 mt-20 max-w-[1400px]">
              <div className="mb-16 flex flex-wrap items-center gap-3">
                <button onClick={() => setLangFilter('ALL')} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${langFilter === 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/[0.03] border-white/5 text-slate-500'}`}>All Nodes</button>
                {Object.values(Language).map(value => (
                  <button key={value} onClick={() => setLangFilter(value)} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${langFilter === value ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/[0.03] border-white/5 text-slate-500'}`}>{value.toUpperCase()}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-8">
                {filteredClients.map(client => (
                  <div key={client.id} className="bg-[#0d1117] p-8 lg:p-12 rounded-[2.5rem] border border-white/[0.03] flex flex-col lg:flex-row items-center justify-between gap-10 group relative overflow-hidden transition-all hover:border-indigo-500/20">
                    <div className="flex items-center gap-8 lg:gap-12 w-full lg:w-auto">
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-indigo-400 border border-white/5 shadow-inner">{client.name[0]}</div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-bold text-3xl text-white tracking-tighter">{client.name} {client.surname}</h3>
                          {client.transcript && (
                             <button onClick={() => setViewingTranscriptClient(client)} className="bg-white/5 p-2 rounded-xl text-indigo-400 hover:bg-white/10 transition-all"><DocumentTextIcon className="w-5 h-5" /></button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <Badge icon={<GlobeAltIcon className="w-4 h-4 text-indigo-500" />} text={client.language.toUpperCase()} />
                          <Badge icon={<MapPinIcon className="w-4 h-4 text-indigo-500" />} text={client.area || 'REGIONAL'} />
                          <Badge icon={<DevicePhoneMobileIcon className="w-4 h-4 text-indigo-500" />} text={client.phone} />
                        </div>
                      </div>
                    </div>
                    <div>
                      {client.status === 'pending' ? (
                        <button onClick={() => handleStartCall(client)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-4"><PhoneIcon className="w-5 h-5" /> Initiate Link</button>
                      ) : (
                        <div className={`px-10 py-5 rounded-3xl flex items-center gap-4 font-black text-[11px] uppercase tracking-[0.3em] border ${client.status === 'qualified' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{client.status.toUpperCase()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Footer />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide">
            <header className="mb-24">
              <div className="flex items-center gap-5 text-indigo-500 mb-8 font-black uppercase tracking-[0.5em] text-lg">
                <PresentationChartLineIcon className="w-10 h-10" />
                Auditing & Analytics
              </div>
              <h1 className="text-8xl lg:text-[10rem] font-black text-white leading-[0.75] tracking-tighter uppercase text-glow">
                Reports<span className="text-indigo-500">.</span>
              </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-24">
              <DashboardMetric label="Success Rate" value={reportsSummary.rate} trend="Neural Efficiency" trendUp={true} icon={<ArrowTrendingUpIcon className="w-6 h-6" />} />
              <DashboardMetric label="Active Engagements" value={reportsSummary.total.toString()} trend="Global Reach" trendUp={true} icon={<GlobeAltIcon className="w-6 h-6" />} />
              <DashboardMetric label="Qualified Leads" value={reportsSummary.qualified.toString()} trend="+4.2% Growth" trendUp={true} icon={<CheckBadgeIcon className="w-6 h-6" />} />
              <DashboardMetric label="System Health" value="OPTIMAL" trend="No Latency" trendUp={true} icon={<CpuChipIcon className="w-6 h-6" />} />
            </div>

            <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl mb-12">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
                 <ClipboardDocumentListIcon className="w-8 h-8 text-indigo-500" />
                 Call Archive (Transcripts)
               </h3>
               <div className="space-y-6 max-h-[800px] overflow-y-auto pr-6 scrollbar-hide">
                  {callArchive.length === 0 ? (
                    <div className="py-20 text-center text-slate-700 font-black uppercase tracking-widest opacity-30">No Archived Sessions</div>
                  ) : callArchive.map((client, idx) => {
                    const lastTimestamp = client.transcript?.[client.transcript.length - 1]?.timestamp;
                    return (
                      <div key={idx} className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 hover:bg-white/[0.05] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black border border-white/5">
                               {client.name[0]}
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <span className="text-xl font-black text-white uppercase tracking-tighter">{client.name} {client.surname}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${client.status === 'qualified' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                                    {client.status}
                                  </span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                     <CalendarIcon className="w-3 h-3" />
                                     {new Date(lastTimestamp || 0).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                     <ClockIcon className="w-3 h-3" />
                                     {new Date(lastTimestamp || 0).toLocaleTimeString()}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => setViewingTranscriptClient(client)} className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center justify-center gap-3">
                            <DocumentTextIcon className="w-4 h-4" /> Transcript
                         </button>
                      </div>
                    );
                  })}
               </div>
            </div>
            <Footer />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="flex-1 overflow-y-auto p-12 lg:p-24 animate-fade-in scrollbar-hide pb-40">
            <header className="mb-24">
              <div className="flex items-center gap-5 text-indigo-500 mb-8 font-black uppercase tracking-[0.5em] text-lg">
                <Cog6ToothIcon className="w-10 h-10" />
                Mission Control
              </div>
              <h1 className="text-8xl lg:text-[10rem] font-black text-white leading-[0.75] tracking-tighter uppercase text-glow">
                Setup<span className="text-indigo-500">.</span>
              </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-[1600px]">
              <div className="space-y-12">
                {/* Neural Verification Terminal */}
                <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8">
                     <SignalIcon className="w-8 h-8 text-indigo-500/20 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-4">
                    <BeakerIcon className="w-8 h-8 text-indigo-500" />
                    Neural Verification Terminal
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-10">Stress test dialect synthesis and response latency.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(Language).map(lang => (
                      <button 
                        key={lang} 
                        onClick={() => handleTestCall(lang)}
                        className="bg-indigo-600/5 hover:bg-indigo-600 hover:text-white border border-indigo-500/10 hover:border-indigo-400 px-8 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-between group/btn shadow-xl hover:shadow-indigo-600/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover/btn:bg-white group-hover/btn:text-indigo-600 transition-colors">
                            <PhoneIcon className="w-4 h-4" />
                          </div>
                          <span>{lang === Language.ENGLISH ? 'English Node' : lang === Language.ZULU ? 'isiZulu Node' : lang === Language.XHOSA ? 'isiXhosa Node' : lang === Language.AFRIKAANS ? 'Afrikaans Node' : 'Sepedi Node'}</span>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 opacity-20 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4"><BuildingOfficeIcon className="w-8 h-8 text-indigo-500" /> Entity Profile</h3>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 block">Company / Brand Name</label>
                      <input type="text" value={callConfig.companyName} onChange={(e) => setCallConfig(prev => ({ ...prev, companyName: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-xl font-bold focus:ring-4 focus:ring-indigo-600/20 outline-none transition-all text-white" placeholder="e.g. Vodacom SA" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 block">Mission Objectives</label>
                      <textarea rows={4} value={callConfig.objectives} onChange={(e) => setCallConfig(prev => ({ ...prev, objectives: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-lg font-medium focus:ring-4 focus:ring-indigo-600/20 outline-none transition-all text-slate-300 leading-relaxed" placeholder="Define mission goal..." />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4"><AdjustmentsHorizontalIcon className="w-8 h-8 text-indigo-500" /> Call Configuration</h3>
                  
                  <div className="mb-12">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6 block">Primary Outreach Language</label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.values(Language).map(lang => (
                        <button 
                          key={lang} 
                          onClick={() => setCallConfig(prev => ({...prev, defaultLanguage: lang}))}
                          className={`px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${callConfig.defaultLanguage === lang ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-300'}`}
                        >
                          {lang === Language.ENGLISH ? 'English' : lang === Language.ZULU ? 'isiZulu' : lang === Language.XHOSA ? 'isiXhosa' : lang === Language.AFRIKAANS ? 'Afrikaans' : 'Sepedi'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6 block">Polyglot Switch Capabilities</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(Language).map(lang => (
                      <button key={lang} onClick={() => toggleLanguage(lang)} className={`px-8 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] border transition-all flex items-center justify-between group ${callConfig.enabledLanguages.includes(lang) ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/[0.03] border-white/5 text-slate-600 hover:text-slate-400'}`}>
                        <span>{lang.toUpperCase()}</span>
                        {callConfig.enabledLanguages.includes(lang) && <CheckCircleIcon className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4"><TagIcon className="w-8 h-8 text-indigo-500" /> Parameter Matrix</h3>
                  <div className="flex flex-wrap gap-3 mb-10">
                    {callConfig.parameters.map(p => (
                      <div key={p} className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl text-indigo-400 font-bold group hover:text-red-400 transition-all cursor-pointer" onClick={() => removeParameter(p)}>
                        {p} <XMarkIcon className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <input type="text" value={newParam} onChange={(e) => setNewParam(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addParameter()} className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-lg font-bold text-white focus:ring-4 focus:ring-indigo-600/20 outline-none transition-all" placeholder="Add Custom Parameter..." />
                    <button onClick={() => addParameter()} className="bg-indigo-600 p-5 rounded-2xl hover:bg-indigo-500 transition-all"><PlusIcon className="w-6 h-6 text-white" /></button>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {activeTab === 'call' && (
          <div className="flex-1 flex flex-col h-full animate-fade-in relative overflow-hidden bg-[#05080f]">
            <div className="flex-1 flex flex-col items-center justify-center p-12 z-30">
               <div className="relative mb-20">
                  <div className={`absolute inset-0 rounded-full border-[40px] border-indigo-500/5 transition-all duration-1000 ${isCalling ? 'scale-[3.5] opacity-100' : 'scale-0 opacity-0'}`}></div>
                  <div className="w-[400px] h-[400px] rounded-[5rem] bg-[#0d1117] flex items-center justify-center border-4 border-white/10 shadow-2xl relative z-10 overflow-hidden ring-8 ring-white/5">
                    <img src={`https://picsum.photos/seed/${activeClient?.id}/1200`} className={`w-full h-full object-cover transition-all duration-1000 ${isCalling ? 'scale-110 opacity-60' : 'opacity-20 blur-2xl'}`} alt="" />
                  </div>
               </div>
               {isCalling ? (
                 <>
                   <h3 className="text-7xl font-black text-white tracking-tighter mb-6 text-glow">{activeClient?.name} {activeClient?.surname}</h3>
                   <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        handleEndCall();
                     }} 
                     className="bg-red-500 hover:bg-red-600 w-32 h-32 rounded-full flex items-center justify-center shadow-xl active:scale-90 border-[12px] border-white/10 relative z-40 cursor-pointer"
                   >
                     <PhoneXMarkIcon className="w-12 h-12 text-white" />
                   </button>
                 </>
               ) : (
                  <button onClick={() => setActiveTab('clients')} className="bg-white text-black px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all relative z-40">Close Terminal</button>
               )}
            </div>
            <div className="absolute bottom-0 right-0 w-[450px] bg-black/80 backdrop-blur-3xl border-l border-t border-white/[0.05] p-10 h-[550px] overflow-hidden flex flex-col z-20">
               <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 flex items-center gap-3">
                    <BoltIcon className="w-5 h-5" /> Live Extraction
                  </h4>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Active Link</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                     <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Person</span>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-white truncate">
                        <UserIcon className="w-3 h-3 text-indigo-400" /> {activeClient?.name} {activeClient?.surname}
                     </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                     <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</span>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                        <CalendarIcon className="w-3 h-3 text-indigo-400" /> {callDate || '-'}
                     </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                     <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Start Time</span>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                        <ClockIcon className="w-3 h-3 text-indigo-400" /> {callStartTime || 'Connecting...'}
                     </div>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                  {transcriptions.map((t, i) => (
                    <div key={i} className={`p-4 rounded-2xl ${t.role === 'user' ? 'bg-indigo-600/10 text-indigo-100' : 'bg-slate-900/50 text-slate-300'}`}>
                       <p className="text-[9px] font-black mb-1 opacity-50 uppercase tracking-widest">{t.role === 'user' ? 'Client' : 'AI Node'}</p>
                       <p className="text-sm font-medium leading-relaxed">{t.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
               </div>
            </div>
          </div>
        )}

        {(activeTab === 'dashboard' || activeTab === 'inbox') && (
           <div className="p-12 lg:p-24 overflow-y-auto h-full scrollbar-hide">
              <h1 className="text-6xl font-black uppercase tracking-tighter mb-12">{activeTab}</h1>
              <div className="bg-white/[0.02] p-20 rounded-[4rem] border border-dashed border-white/10 text-center opacity-30">
                 <CpuChipIcon className="w-20 h-20 mx-auto mb-6 text-slate-600" />
                 <p className="font-black text-sm uppercase tracking-[0.5em]">Node Initializing</p>
              </div>
              <Footer />
           </div>
        )}

        {viewingTranscriptClient && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-12 bg-black/90 backdrop-blur-2xl animate-fade-in">
             <div className="bg-[#05070d] w-full max-w-4xl rounded-[3rem] border border-white/10 p-12 relative shadow-2xl flex flex-col h-[80vh]">
                <button onClick={() => setViewingTranscriptClient(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><XMarkIcon className="w-10 h-10" /></button>
                <header className="mb-10">
                   <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Call Transcript Archive</h2>
                   <p className="text-slate-500 font-bold text-sm uppercase mt-2">Person: {viewingTranscriptClient.name} {viewingTranscriptClient.surname}</p>
                </header>
                <div className="flex-1 overflow-y-auto space-y-6 pr-6 scrollbar-hide">
                  {viewingTranscriptClient.transcript?.map((entry, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border ${entry.role === 'user' ? 'bg-indigo-600/5 border-indigo-500/20' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{entry.role === 'user' ? 'Lead' : 'AI Node'}</span>
                        <span className="text-[9px] text-slate-700 font-bold">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-lg leading-relaxed text-slate-300">{entry.text}</p>
                    </div>
                  ))}
                </div>
                <footer className="mt-10 pt-8 border-t border-white/5"><button onClick={() => setViewingTranscriptClient(null)} className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all w-full">Close Archive</button></footer>
             </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.19, 1, 0.22, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .text-glow { text-shadow: 0 0 30px rgba(99, 102, 241, 0.3); }
      `}</style>
    </div>
  );
};

export default App;
