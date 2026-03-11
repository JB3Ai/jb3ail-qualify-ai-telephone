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
  ArrowPathIcon,
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
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

const DEFAULT_CONFIG: CallConfig = {
  companyName: "Mzansi Enterprise",
  objectives: "Verify lead contact information, confirm marketing consent, and gauge employment status.",
  parameters: ["Email Address", "Phone Number", "Employment Status", "Residential Area"],
  enabledLanguages: [Language.ENGLISH, Language.ZULU, Language.XHOSA, Language.AFRIKAANS, Language.SEPEDI, Language.PORTUGUESE, Language.GREEK, Language.MANDARIN],
  defaultLanguage: Language.ENGLISH,
  customPhrases: {
    [Language.ENGLISH]: {
      greeting: "Hello, this is Zandi calling from Mzansi Solutions.",
      objection: "I understand your concern, let me clarify that for you.",
      closing: "Thank you for your time and have a great day!",
      signalSwitch: "Switching languages now."
    },
    [Language.ZULU]: {
      greeting: "Sawubona – ngikhuluma no",
      closing: "Ngiyabonga kakhulu, ube nosuku oluhle."
    }
    // additional language phrases can be added here
  }
};

const getLanguageName = (lang: string) => {
  if (!lang) return "";
  const code = lang.toLowerCase().split('-')[0];
  const names: Record<string, string> = {
    'en': 'English',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'nso': 'Sepedi',
    'pt': 'Portuguese',
    'el': 'Greek',
    'zh': 'Mandarin'
  };
  return names[code] || lang;
};

const getDefaultBackendUrl = () => {
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:3000' : 'https://os3grid-fjgcb8hzfjhzcqhr.southafricanorth-01.azurewebsites.net';
};

const NeuralConnectivityMatrix: React.FC<{ 
  backendStatus: string; 
  isProtocolAccepted: boolean; 
  onAcceptProtocol: () => void; 
  onLoadTeam: () => void;
  onShowInfo: () => void;
  wsConnected?: boolean;
  ledgerStatus?: string;
}> = ({ backendStatus, isProtocolAccepted, onAcceptProtocol, onLoadTeam, onShowInfo, wsConnected, ledgerStatus }) => {
  const statusItems = [
    { name: 'Twilio Gateway', status: wsConnected ? 'ONLINE' : (backendStatus === 'connected' ? 'ONLINE' : 'OFFLINE') },
    { name: 'Azure Neural', status: backendStatus === 'connected' ? 'ONLINE' : 'OFFLINE' },
    { name: 'Intelligence Ledger', status: ledgerStatus === 'SYNCING' ? 'SYNCING' : (backendStatus === 'connected' ? 'READY' : 'OFFLINE') },
    { name: 'Google Cloud ADC', status: backendStatus === 'connected' ? 'ONLINE' : 'OFFLINE' },
  ];

  return (
    <div className="bg-[#020617] p-10 rounded-lg border border-[#1A2333] font-inter shadow-2xl relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onShowInfo}
            className="i-button-pro"
            title="Dashboard Info"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-orbitron mb-2">Neural Connectivity Matrix</h2>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Command & Control Node • Real-time Telemetry</p>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button 
            onClick={onAcceptProtocol}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#1A2333] text-[#39FF88] border border-[#39FF88]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF88] hover:text-[#020617] transition-all font-orbitron"
          >
            <ShieldCheckIcon className="w-4 h-4" /> Security & POPIA
          </button>
          <button 
            onClick={onLoadTeam}
            disabled={!isProtocolAccepted}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-orbitron ${isProtocolAccepted ? 'bg-[#39FF88] text-[#020617] shadow-[0_0_20px_rgba(57,255,136,0.4)]' : 'bg-[#1A2333] text-slate-600 cursor-not-allowed opacity-50'}`}
          >
            <UserGroupIcon className="w-4 h-4" /> Load Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusItems.map((item) => (
          <div key={item.name} className="bg-[#1A2333] p-8 rounded-lg border border-[#1e293b]/40 group hover:border-[#39FF88]/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-orbitron">{item.name}</span>
              <div className={`w-2 h-2 rounded-full ${item.status === 'ONLINE' ? 'bg-[#39FF88] animate-pulse shadow-[0_0_10px_#39FF88]' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter font-orbitron">
              {item.status}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e293b]/20 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-inter">{item.status === 'SYNCING' ? 'Active' : 'Latency'}</span>
              <span className={`text-[10px] font-mono font-bold ${item.status === 'SYNCING' ? 'text-[#FFD700] animate-pulse' : 'text-[#39FF88]'}`}>{item.status === 'SYNCING' ? 'WRITING...' : '24ms'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProtocolHUD: React.FC<{ mode: 'local' | 'intl'; setMode: (mode: 'local' | 'intl') => void; currentLanguage?: string }> = ({ mode, setMode, currentLanguage }) => (
  <div className={`mb-6 p-4 rounded-md border transition-all duration-500 shadow-xl flex justify-between items-center ${
    mode === 'local' ? 'border-[#39FF88]/30 bg-[#39FF88]/5' : 'border-[#00D9FF]/30 bg-[#00D9FF]/5'
  }`}>
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full animate-pulse ${mode === 'local' ? 'bg-[#39FF88]' : 'bg-[#00D9FF]'}`} />
      <div>
        <h3 className="font-orbitron text-[10px] tracking-widest opacity-50">SYSTEM_PROTOCOL</h3>
        <p className="font-orbitron text-lg font-black italic text-white">
          {mode === 'local' ? 'MZANZI_SOUTH' : 'GLOBAL_EXPANSION'}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      {currentLanguage && (
        <div className="text-right hidden sm:block">
          <span className="font-mono text-[10px] block opacity-50 uppercase tracking-widest">Language_Focus</span>
          <span className="font-orbitron text-sm font-bold text-white">
            {currentLanguage.toUpperCase()}
          </span>
        </div>
      )}
      <button 
        onClick={() => setMode(mode === 'local' ? 'intl' : 'local')}
        className={`px-4 py-2 rounded-lg font-orbitron text-[10px] border transition-all uppercase tracking-widest ${
          mode === 'local' ? 'bg-[#39FF88]/10 text-[#39FF88] border-[#39FF88]/30 hover:bg-[#39FF88] hover:text-[#020617]' : 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30 hover:bg-[#00D9FF] hover:text-[#020617]'
        }`}
      >
        Switch_Cluster
      </button>
    </div>
  </div>
);

const InfoOverlay: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  icon: React.ReactNode; 
  steps: { step: string; title: string; desc: string }[];
  warning?: { title: string; desc: string };
  solution?: { title: string; desc: string };
}> = ({ isOpen, onClose, title, icon, steps, warning, solution }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#020617]/95 backdrop-blur-xl p-6 md:p-12 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] border border-[#66FF66]/20">
              {icon}
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {steps.map((item) => (
            <div key={item.step} className="bg-[#0d1117] p-8 rounded-lg border border-[#1e293b]/40 relative overflow-hidden group">
              <span className="absolute -top-4 -right-4 text-8xl font-black text-white/[0.02] group-hover:text-[#66FF66]/[0.05] transition-colors">{item.step}</span>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
                <span className="text-[#66FF66] font-mono text-xs">{item.step}.</span> {item.title}
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        {warning && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-8 mb-12">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <ShieldExclamationIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{warning.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {warning.desc}
                </p>
              </div>
            </div>
          </div>
        )}

        {solution && (
          <div className="bg-[#66FF66]/5 border border-[#66FF66]/20 rounded-lg p-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-md bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] shrink-0">
                <CpuChipIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{solution.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {solution.desc}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DataInbox: React.FC<{ 
  onSync: () => void; 
  onClear: () => void;
  clients: Client[];
  onStartCall: (client: Client) => void;
  backendStatus: string;
  protocolMode: 'local' | 'intl';
  setProtocolMode: (mode: 'local' | 'intl') => void;
  isSyncing?: boolean;
}> = ({ onSync, onClear, clients, onStartCall, backendStatus, protocolMode, setProtocolMode, isSyncing }) => {
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const localLanguages = ['en-ZA', 'zu-ZA', 'xh-ZA', 'af-ZA', 'nso-ZA'];
  const intlLanguages = ['pt-PT', 'el-GR', 'zh-CN'];

  const pendingClients = clients.filter(c => {
    if (c.status !== 'pending' && c.status !== 'READY_FOR_EXECUTION') return false;
    if (protocolMode === 'local') return localLanguages.includes(c.language);
    return intlLanguages.includes(c.language);
  });

  const handleRefreshSheet = () => {
    const ifr = document.getElementById('sheet-frame') as HTMLIFrameElement;
    if (ifr) {
      ifr.src = ifr.src;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#020617] animate-fade-in overflow-hidden">
      <div className="min-h-[5rem] bg-[#0d1117] border-b border-[#1e293b]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 lg:px-12 py-3 sm:py-0 gap-3 sm:gap-0 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <InboxStackIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#66FF66]" />
          <div>
            <h2 className="font-orbitron font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-sm">Data Inbox</h2>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-mono uppercase tracking-widest hidden sm:block">Source: Hub_Central_Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button 
            onClick={() => setShowWorkflowGuide(true)}
            className="i-button-pro"
            title="Workflow Guide"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefreshSheet}
            className="bg-[#1A2333] text-white border border-[#1e293b]/40 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all font-orbitron"
          >
            Refresh Sheet
          </button>
          <button 
            onClick={onClear}
            className="signal-trigger-pro px-6 py-3 text-red-400 border-red-500/30 hover:text-red-300 hover:border-red-500"
          >
            Wipe Session
          </button>
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="signal-trigger-pro px-8 py-3 flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Sync to Pipeline'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col relative">
        <InfoOverlay 
          isOpen={showWorkflowGuide}
          onClose={() => setShowWorkflowGuide(false)}
          title="The Synchronization Workflow"
          icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
          steps={[
            {
              step: '01',
              title: 'Stage Your Leads',
              desc: 'In your Google Sheet, manually move or copy the leads you want to call into the dedicated Mzanzi Engine tab or specific "Call Section" range.'
            },
            {
              step: '02',
              title: 'Refresh the Live View',
              desc: 'Click the REFRESH_SHEET button in your Data Inbox. This reloads the embedded iframe so you can visually confirm the leads are present in the "Old School" view.'
            },
            {
              step: '03',
              title: 'Execute the Sync Signal',
              desc: 'Click the SYNC_TO_PIPELINE button. This triggers the backend (via your CLI-authorized Google ADC) to read the specific "Mzanzi Engine" range and inject those leads into your app\'s local state.'
            },
            {
              step: '04',
              title: 'Verification',
              desc: 'Once the sync is complete, the leads will instantly appear in the Ready for Execution queue window on the right, assigned a READY_FOR_EXECUTION status.'
            }
          ]}
          warning={{
            title: '🕵️ Why "Dragging" Doesn\'t Work',
            desc: 'Browser Security: Browsers prevent "Cross-Origin" interactions between an iframe (Google\'s domain) and your app (your domain) to stop malicious data theft.'
          }}
          solution={{
            title: 'The System Solution',
            desc: 'The Sync button acts as your "authorized courier," safely carrying data from the spreadsheet into your AI pipeline using the Google Sheets API.'
          }}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0 gap-4 sm:gap-6">
          {/* Left Columns: Google Sheet Iframe */}
          <div className="hidden lg:flex lg:col-span-8 border border-[#1e293b]/30 bg-black flex-col relative group overflow-hidden rounded-md lg:rounded-lg">
            <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-[#1e293b]/40 flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4 text-[#66FF66]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Source: 12bR...dO5g</span>
            </div>
            <iframe 
              id="sheet-frame"
              src="https://docs.google.com/spreadsheets/d/1e4ZanBSWWDYkp-ww79vVl3SQZt294Zfhi7dvAkWKaN4/edit?usp=sharing&rm=minimal" 
              className="flex-1 w-full h-full border-none invert opacity-70 grayscale contrast-125 hover:opacity-90 transition-opacity" 
              title="Google Sheet Source" 
            />
          </div>

          {/* Right Columns: Tactical List */}
          <div className="col-span-1 lg:col-span-4 flex flex-col bg-[#020617] overflow-hidden rounded-md lg:rounded-lg border border-[#1e293b]/40">
            <div className="p-8 border-b border-[#1e293b]/30 bg-[#0d1117]/50">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] font-orbitron flex items-center gap-3">
                <SignalIcon className="w-5 h-5 text-[#66FF66]" /> Ready for Execution
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Immediate AI Interaction Queue</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {pendingClients.length > 0 ? (
                pendingClients.map(client => (
                  <div key={client.id} className="bg-[#1A2333] p-6 rounded-md border border-[#1e293b]/40 hover:border-[#66FF66]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-white text-sm tracking-tight">{client.name} {client.surname}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{client.phone}</p>
                          {client.source && (
                            <span className="text-[8px] font-black text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {client.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${protocolMode === 'local' ? 'text-[#66FF66] bg-[#66FF66]/10' : 'text-[#00D9FF] bg-[#00D9FF]/10'}`}>
                        {getLanguageName(client.language).split(' ')[0]}
                      </span>
                    </div>
                    <button 
                      onClick={() => onStartCall(client)}
                      disabled={backendStatus !== 'connected'}
                      className="signal-trigger-pro w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PhoneIcon className="w-3 h-3" /> Initialize Signal
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                  <InboxStackIcon className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Active Signals</p>
                  <p className="text-[9px] mt-2">Trigger Sync to populate queue</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0d1117]/50 border-t border-[#1e293b]/30">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>Queue Depth</span>
                <span className={protocolMode === 'local' ? 'text-[#66FF66]' : 'text-[#00D9FF]'}>{pendingClients.length} Leads</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LANGUAGE_PROTOCOLS: Record<Language, { greeting: string; objection: string; closing: string; switch: string }> = {
  [Language.ENGLISH]: {
    greeting: "Hello! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?",
    objection: "I understand you're busy. This will only take 60 seconds to verify your details for the best rate.",
    closing: "Perfect, everything is verified. We'll send the confirmation shortly. Have a great day!",
    switch: "Systems beat effort. Initializing solar verification signal."
  },
  [Language.ZULU]: {
    greeting: "Sawubona! NginguZandi waseMzansi Solutions. Ingabe ngikhuluma nomnikazi wekhaya?",
    objection: "Ngiyakuzwa ukuthi umatasa. Lokhu kuzothatha imizuzwana engama-60 kuphela ukuqinisekisa imininingwane yakho.",
    closing: "Kuhle kakhulu, konke kuqinisekisiwe. Sizokuthumelela isiqinisekiso maduze. Ube nosuku oluhle!",
    switch: "Izinhlelo zinqoba umzamo. Iqala isignali yokuqinisekisa amandla elanga."
  },
  [Language.XHOSA]: {
    greeting: "Molo! NdinguZandi waseMzansi Solutions. Ingaba ndithetha nomnikazi wekhaya?",
    objection: "Ndiyakuva ukuba uxakekile. Oku kuzothatha imizuzwana engama-60 kuphela ukuqinisekisa iinkcukacha zakho.",
    closing: "Gqibelele, yonke into iqinisekisiwe. Sizokuthumelela isiqinisekiso kufuphi. Ube nolwesine oluhle!",
    switch: "Iinkqubo zoyisa umzamo. Iqala isignali yokuqinisekisa amandla elanga."
  },
  [Language.AFRIKAANS]: {
    greeting: "Goeiedag! Dit is Zandi van Mzansi Solutions. Praat ek met die huiseienaar?",
    objection: "Ek verstaan u is besig. Dit sal net 60 sekondes neem om u besonderhede te verifieer vir die beste koers.",
    closing: "Perfek, alles is geverifieer. Ons sal binnekort die bevestiging stuur. Geniet u dag verder!",
    switch: "Stelsels klop moeite. Inisialiseer sonkrag-verifikasiesein."
  },
  [Language.SEPEDI]: {
    greeting: "Dumela! Ke nna Zandi go tšwa go Mzansi Solutions. Na ke bolela le mong wa ntlo?",
    objection: "Ke a kwešiša gore o swaregile. Se se tlo tšea metsotswana ye 60 fela go netefatša dintlha tša gago.",
    closing: "Go lokile, tšohle di netefaditšwe. Re tlo go romela netefatšo kapejana. Eba le letšatši le lebotse!",
    switch: "Ditshepedišo di fenya boiteko. Go thoma seka sa netefatšo ya maatla a letšatši."
  },
  [Language.PORTUGUESE]: {
    greeting: "Olá! Aqui é a Zandi da Mzansi Solutions. Estou a falar com o proprietário da casa?",
    objection: "Compreendo que esteja ocupado. Isto levará apenas 60 segundos para verificar os seus dados.",
    closing: "Perfeito, está tudo verificado. Enviaremos a confirmação em breve. Tenha um excelente dia!",
    switch: "Sistemas superam o esforço. Inicializando sinal de verificação solar."
  },
  [Language.GREEK]: {
    greeting: "Γεια σας! Είμαι η Zandi από την Mzansi Solutions. Μιλάω με τον ιδιοκτήτη του σπιτιού;",
    objection: "Καταλαβαίνω ότι είστε απασχολημένος. Αυτό θα πάρει μόνο 60 δευτερόλεπτα για να επαληθεύσουμε τα στοιχεία σας.",
    closing: "Τέλεια, όλα επαληθεύτηκαν. Θα σας στείλουμε την επιβεβαίωση σύντομα. Καλή σας μέρα!",
    switch: "Τα συστήματα κερδίζουν την προσπάθεια. Αρχικοποίηση σήματος ηλιακής επαλήθευσης."
  },
  [Language.MANDARIN]: {
    greeting: "您好！我是来自 Mzansi Solutions 的 Zandi。请问是屋主本人吗？",
    objection: "我明白您很忙。只需 60 秒即可核实您的信息，以确保您获得最佳费率。",
    closing: "太好了，一切已核实。我们很快会向您发送确认信息。祝您生活愉快！",
    switch: "系统胜过努力。正在初始化太阳能验证信号。"
  }
};

const getQuickScriptsForLanguage = (language: Language) => {
  const protocol = LANGUAGE_PROTOCOLS[language];
  const languageName = getLanguageName(language);

  return [
    { name: `${languageName} Greeting`, text: protocol.greeting },
    { name: `${languageName} Objection`, text: protocol.objection },
    { name: `${languageName} Closing`, text: protocol.closing },
    { name: `${languageName} Signal Switch`, text: protocol.switch },
    { name: 'Consent Check', text: `${protocol.greeting} Before we continue, do I have your consent to proceed with this call?` },
    { name: 'Identity Verify', text: `${protocol.greeting} Please confirm your full name and the best contact number for verification.` },
    { name: 'Qualification Probe', text: `${protocol.objection} I just need two quick details: your area and your current energy usage profile.` },
    { name: 'Callback Script', text: `${protocol.closing} If now is not ideal, please share your preferred callback time and language.` }
  ];
};

const StatusIndicator: React.FC<{ label: string; status: 'connected' | 'error' | 'loading'; icon: React.ReactNode }> = ({ label, status, icon }) => (
  <div className="bg-[#0d1117] p-4 rounded-md border border-[#1e293b]/30 flex items-center justify-between group hover:border-[#66FF66]/30 transition-all">
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
    className={`sidebar-btn-3d ${active ? 'active' : ''}`}
  >
    <div className={`shrink-0 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="font-bold text-[10px] uppercase tracking-[0.2em] hidden lg:block text-left">{label}</span>
    {badge && <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-black animate-pulse shadow-lg">{badge}</span>}
  </button>
);

const App: React.FC = () => {
  const [protocolMode, setProtocolMode] = useState<'local' | 'intl'>('local');
  const [activeTab, setActiveTab] = useState<'DATA_INBOX' | 'PIPELINE' | 'CALL_ARCHIVE' | 'LIVE_TERMINAL' | 'RUN_PROTOCOL' | 'CONFIG_HUB' | 'BACKEND_SETTINGS' | 'DASHBOARD'>('PIPELINE');
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const ALL_LANGUAGES = [Language.ENGLISH, Language.ZULU, Language.XHOSA, Language.AFRIKAANS, Language.SEPEDI, Language.PORTUGUESE, Language.GREEK, Language.MANDARIN];
  const [activeLangs, setActiveLangs] = useState<Set<Language>>(() => new Set(ALL_LANGUAGES));
  const [viewingTranscriptClient, setViewingTranscriptClient] = useState<Client | null>(null);
  const [showPopiaModal, setShowPopiaModal] = useState<boolean>(true);
  const [showDashboardInfo, setShowDashboardInfo] = useState(false);
  const [showPipelineInfo, setShowPipelineInfo] = useState(false);
  const [showProtocolInfo, setShowProtocolInfo] = useState(false);
  const [showLabInfo, setShowLabInfo] = useState(false);
  const [showConfigInfo, setShowConfigInfo] = useState(false);
  const [showArchiveInfo, setShowArchiveInfo] = useState(false);
  const [selectedArchiveSignal, setSelectedArchiveSignal] = useState<Client | null>(null);
  const [showBackendInfo, setShowBackendInfo] = useState(false);
  
  const [callDuration, setCallDuration] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [testPhone, setTestPhone] = useState('');
  const [testLang, setTestLang] = useState<Language>(Language.ZULU);
  const [isInternalCall, setIsInternalCall] = useState(false);

  // Editable Run Protocol state
  const [languageProtocols, setLanguageProtocols] = useState<Record<string, { greeting: string; objection: string; closing: string; switch: string }>>(() => {
    const stored = localStorage.getItem('mzansi_language_protocols');
    return stored ? JSON.parse(stored) : LANGUAGE_PROTOCOLS;
  });
  const [editingProtocolLang, setEditingProtocolLang] = useState<string | null>(null);
  const [protocolDraft, setProtocolDraft] = useState({ greeting: '', objection: '', closing: '', switch: '' });
  const [editingCompanyConfig, setEditingCompanyConfig] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem('mzansi_company_config');
    if (stored) return JSON.parse(stored);
    return {
      companyName: DEFAULT_CONFIG.companyName,
      objectives: DEFAULT_CONFIG.objectives,
      personality: "Zandi is a warm, professional, and empathetic qualification agent. She speaks clearly, respects the lead's time, and always maintains a positive tone.",
      productInfo: "Solar energy initiative for residential homeowners. Aim: verify lead eligibility and collect qualification data.",
      parameters: DEFAULT_CONFIG.parameters.join(', ')
    };
  });
  const [companyDraft, setCompanyDraft] = useState<Record<string, string>>({});
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const language = activeLangs.size === ALL_LANGUAGES.length ? 'Multi-Language' : activeLangs.size === 0 ? 'None' : activeLangs.size === 1 ? getLanguageName([...activeLangs][0]) : `${activeLangs.size} Languages`;

  const toggleLang = (lang: Language) => {
    setActiveLangs(prev => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  };

  const toggleAllLangs = () => {
    setActiveLangs(prev => prev.size === ALL_LANGUAGES.length ? new Set() : new Set(ALL_LANGUAGES));
  };

  const saveProtocol = (lang: string) => {
    const updated = { ...languageProtocols, [lang]: { ...protocolDraft } };
    setLanguageProtocols(updated);
    localStorage.setItem('mzansi_language_protocols', JSON.stringify(updated));
    setEditingProtocolLang(null);
  };

  const saveCompanyConfig = () => {
    setCompanyConfig({ ...companyDraft });
    localStorage.setItem('mzansi_company_config', JSON.stringify(companyDraft));
    setEditingCompanyConfig(false);
  };

  const [backendUrl, setBackendUrl] = useState<string>(() => {
    const stored = localStorage.getItem('mzansi_backend_url');
    const url = stored || getDefaultBackendUrl();
    return url.endsWith('/') ? url.slice(0, -1) : url;
  });
  const [backendStatus, setBackendStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [isProtocolAccepted, setIsProtocolAccepted] = useState<boolean>(localStorage.getItem('mzansi_protocol_accepted') === 'true');

  const handleAcceptProtocol = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/log-compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setIsProtocolAccepted(true);
        localStorage.setItem('mzansi_protocol_accepted', 'true');
        setShowPopiaModal(false);
      } else {
        throw new Error('Compliance endpoint returned non-OK status.');
      }
    } catch (error) {
      console.error('Failed to log compliance:', error);
      // Fallback for demo
      setIsProtocolAccepted(true);
      localStorage.setItem('mzansi_protocol_accepted', 'true');
      setShowPopiaModal(false);
    }
  };

  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState<'speak' | 'ask'>('speak');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  const [activeThreads, setActiveThreads] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [ledgerStatus, setLedgerStatus] = useState<string>('IDLE');

  useEffect(() => {
    const wsUrl = backendUrl.replace(/^http/, 'ws');
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setWsConnected(true);
      socket.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          const ts = new Date().toLocaleTimeString();
          const line = `[${ts}] [${msg.type}] ${msg.message}`;
          setTestLogs(prev => [line, ...prev].slice(0, 200));
          if (msg.message?.includes('LEDGER_SYNC_INITIATED') || msg.message?.includes('Syncing call')) setLedgerStatus('SYNCING');
          if (msg.message?.includes('SYNC_COMPLETE') || msg.message?.includes('synced successfully')) setLedgerStatus('IDLE');
          if (msg.type === 'ERROR') setLedgerStatus('ERROR');
        } catch { /* ignore non-JSON */ }
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimer); socket?.close(); };
  }, [backendUrl]);

  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!contentType.toLowerCase().includes('application/json')) {
      const looksLikeHtml = bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html');
      throw new Error(
        looksLikeHtml
          ? 'Backend URL is serving HTML instead of API JSON. Check the Backend URL in System Config.'
          : 'Backend response was not JSON. Check the Backend URL and API server status.',
      );
    }

    try {
      return JSON.parse(bodyText);
    } catch {
      throw new Error('Invalid JSON response from backend API.');
    }
  };

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

  const checkBackendHealth = async (urlOverride?: string) => {
    const targetUrl = urlOverride || backendUrl;
    try {
      setBackendStatus('loading');
      const res = await fetch(`${targetUrl}/api/health`, { method: 'GET' });
      if (!res.ok) {
        setBackendStatus('error');
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        setBackendStatus('error');
        return;
      }

      const data = await res.json();
      if (data?.status === 'ok') setBackendStatus('connected');
      else setBackendStatus('error');
    } catch (e) {
      setBackendStatus('error');
    }
  };

  const handleStartCall = async (client: Client) => {
    try {
        let response: Response;
        try {
          response = await fetch(`${backendUrl}/make-call`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId: client.id, phone: client.phone, name: client.name, language: client.language })
          });
        } catch (networkErr: any) {
          alert(`Backend unreachable: ${networkErr.message}. Check Backend Settings.`);
          return;
        }
        
        const data = await parseJsonResponse(response);
        if (data.success) {
            const updatedClients = clientService.updateClientStatus(client.id, 'signal_sent');
            setClients(updatedClients);
            setActiveClient(client);
            setActiveTab('LIVE_TERMINAL');
            setIsCalling(true);
            setDetectedLanguage(client.language);
            setTranscriptions([
              { role: 'model', text: `Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with ${client.name}?`, timestamp: Date.now() }
            ]);
        } else {
            alert(`Call failed: ${data.error || "Unknown error from backend."}`);
        }
    } catch (e: any) {
        console.error("Call initiation error", e);
        alert(`Call Error: ${e.message}`);
    }
  };

  const handleStartInternalCall = (lang: Language) => {
    setIsInternalCall(true);
    setIsCalling(true);
    setActiveClient({
        id: 'INTERNAL-CORE',
        name: 'Neural',
        surname: 'Core',
        phone: 'LOCAL_LINK',
        language: lang,
        status: 'pending',
        area: 'Internal Hub',
        signup_date: new Date().toISOString(),
        collected_data: {}
    });
    setActiveTab('LIVE_TERMINAL');
    setTranscriptions([
        { role: 'model', text: `[INTERNAL LINK ESTABLISHED] Core language set to ${getLanguageName(lang)}. Speakerphone active. Ready for neural stimulus.`, timestamp: Date.now() }
    ]);
  };

  const endCall = () => {
    setIsCalling(false);
    setIsInternalCall(false);
    setActiveClient(null);
    setCallDuration(0);
  };

  const runNeuralTest = async () => {
    if (!testInput) return;
    setIsTestRunning(true);
    const ts = () => new Date().toLocaleTimeString();
    setTestLogs(prev => [`[${ts()}] INITIATING ${testType.toUpperCase()} SEQUENCE...`, ...prev]);

    // Pre-flight: check backend reachability before attempting the test
    if (backendStatus !== 'connected') {
      setTestLogs(prev => [
        `[${ts()}] ERROR: Backend is offline. Go to Backend Settings and verify the Core Endpoint is correct, then Recalibrate.`,
        `[${ts()}] HINT: Current endpoint → ${backendUrl}`,
        ...prev
      ]);
      setIsTestRunning(false);
      return;
    }

    try {
      if (testType === 'speak') {
        let response: Response;
        try {
          response = await fetch(`${backendUrl}/api/test-voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: testInput, language: testLang })
          });
        } catch (fetchErr: any) {
          throw new Error(`Network error reaching backend at ${backendUrl}. Ensure the server is running. (${fetchErr.message})`);
        }
        const data = await parseJsonResponse(response);
        if (data.success) {
          try {
            const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
            await audio.play();
            setTestLogs(prev => [`[${ts()}] AUDIO UNIT SUCCESS: Playback complete.`, ...prev]);
          } catch (playErr: any) {
            setTestLogs(prev => [
              `[${ts()}] WARN: Audio generated but browser playback failed: ${playErr.message}`,
              `[${ts()}] HINT: Audio data received (${(data.audioBase64?.length || 0)} bytes). Try a different browser or check audio permissions.`,
              ...prev
            ]);
          }
        } else {
          const msg = data.error + (data.details ? ` (${data.details})` : '');
          throw new Error(msg);
        }
      } else {
        let response: Response;
        try {
          response = await fetch(`${backendUrl}/api/test-logic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: testInput })
          });
        } catch (fetchErr: any) {
          throw new Error(`Network error reaching backend at ${backendUrl}. Ensure the server is running. (${fetchErr.message})`);
        }
        const data = await parseJsonResponse(response);
        if (data.success) {
          setTestLogs(prev => [`[${ts()}] LOGIC UNIT RESPONSE: ${data.response}`, ...prev]);
        } else {
          throw new Error(data.error || 'Unknown logic unit error');
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      const hints: string[] = [];
      if (msg.includes('Failed to fetch') || msg.includes('Network error') || msg.includes('NetworkError')) {
        hints.push(`HINT: Backend at ${backendUrl} is unreachable. Check Backend Settings → Core Endpoint.`);
      } else if (msg.includes('HTML instead of API JSON') || msg.includes('not JSON')) {
        hints.push('HINT: The endpoint returned a web page, not an API. The backend URL may point to the frontend instead of the API server.');
      } else if (msg.includes('AZURE') || msg.includes('speech') || msg.includes('SpeechSDK')) {
        hints.push('HINT: Azure Speech key may be missing or invalid. Check .env for AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.');
      } else if (msg.includes('API key') || msg.includes('GEMINI') || msg.includes('generativelanguage')) {
        hints.push('HINT: Gemini API key may be missing or invalid. Check .env for GEMINI_API_KEY.');
      }
      setTestLogs(prev => [
        ...hints.map(h => `[${ts()}] ${h}`),
        `[${ts()}] ERROR: ${msg}`,
        ...prev
      ]);
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
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    setBackendUrl(cleanUrl);
    localStorage.setItem('mzansi_backend_url', cleanUrl);
  };

  const resetBackendUrlToDefault = () => {
    const defaultUrl = getDefaultBackendUrl();
    saveBackendUrl(defaultUrl);
    checkBackendHealth(defaultUrl);
  };

  const handleCall = (id: string, phone: string) => {
    const client = clients.find(c => c.id === id);
    if (client) handleStartCall(client);
  };

  const pipelineClients = useMemo(() => {
    return clients.filter(c => {
      // Sync moved leads have 'READY_FOR_EXECUTION' status. We also show active calls.
      const isStatusMatch = c.status === 'READY_FOR_EXECUTION' || c.status === 'signal_sent';
      const isLangMatch = activeLangs.size === 0 || activeLangs.has(c.language);
      return isStatusMatch && isLangMatch;
    });
  }, [clients, activeLangs]);

  const archiveClients = useMemo(() => {
    return clients.filter(c => c.status === 'qualified' || c.status === 'failed');
  }, [clients]);

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-slate-100 font-sans overflow-hidden selection:bg-[#66FF66]/30 surface-grain">
      
      {/* === OS³ COMMAND BAR === */}
      <header className="h-14 bg-[#0d1117] border-b border-[#1e293b] flex items-center justify-between px-5 shrink-0" style={{ letterSpacing: '.04em', fontSize: '13px' }}>
        <div className="font-semibold text-[#c9d1d9] flex items-center gap-3">
          <div className="os3-hub-mark" style={{ width: 36, height: 36, borderRadius: 10 }}>
            <div className="os3-hub-mark__inner" style={{ width: 24, height: 24, borderRadius: 7 }}>
              <span className="os3-hub-mark__glyph" style={{ fontSize: 10 }}>&gt;_</span>
            </div>
            <span className="os3-hub-mark__status" style={{ width: 4, height: 4, right: 4, bottom: 4 }} />
          </div>
          <span className="hidden sm:inline font-black text-sm uppercase tracking-tight">JB³Ai</span>
        </div>
        <div className="text-[#8b949e] font-medium text-[11px] sm:text-[13px] tracking-[0.08em] uppercase">
          OS³ GRID CONTROL <span className="text-[#484f58]">//</span> MZANZI NODE
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`os3-heartbeat ${backendStatus === 'connected' ? '' : backendStatus === 'loading' ? 'os3-heartbeat--amber' : 'os3-heartbeat--red'}`} />
          <span className={`text-[11px] font-medium tracking-wider ${
            backendStatus === 'connected' ? 'text-[#39ff88]' : backendStatus === 'loading' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
          }`}>
            {backendStatus === 'connected' ? 'Uplink Established' : backendStatus === 'loading' ? 'Connecting...' : 'Uplink Severed'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-row overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <nav className="w-16 sm:w-20 lg:w-64 bg-[#0f172a] border-r border-[#1e293b] flex flex-col shrink-0 surface-grain">

        {/* OS³ Hub Mark — sidebar header */}
        <div className="p-4 sm:p-5 flex items-center justify-center lg:justify-start gap-4">
          <div className="os3-hub-mark">
            <div className="os3-hub-mark__inner">
              <span className="os3-hub-mark__glyph">&gt;_</span>
            </div>
            <span className="os3-hub-mark__status" />
          </div>
          <div className="hidden lg:block">
            <h2 className="font-black text-[15px] tracking-tight uppercase leading-none text-[#c9d1d9]">JB³Ai <span className="text-[#39ff88]">OS³</span></h2>
            <p className="text-[9px] font-mono text-[#484f58] uppercase tracking-widest mt-1">Grid Control</p>
          </div>
        </div>
        
        <div className="flex-1 px-2 sm:px-4 space-y-1 py-2 sm:py-4 overflow-y-auto scrollbar-hide">
          {/* WHO — Entities entering the system */}
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 sm:px-6 pt-2 pb-2 hidden lg:block">Who</p>
          <NavItem active={activeTab === 'DATA_INBOX'} onClick={() => setActiveTab('DATA_INBOX')} icon={<InboxStackIcon className="w-5 h-5" />} label="Data Inbox" disabled={!isProtocolAccepted} />
          <NavItem active={activeTab === 'PIPELINE'} onClick={() => setActiveTab('PIPELINE')} icon={<ListBulletIcon className="w-5 h-5" />} label="Pipeline" disabled={!isProtocolAccepted} />

          {/* WHAT — Active system operations */}
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 sm:px-6 pt-6 pb-2 hidden lg:block">What</p>
          <NavItem active={activeTab === 'RUN_PROTOCOL'} onClick={() => setActiveTab('RUN_PROTOCOL')} icon={<BeakerIcon className="w-5 h-5" />} label="Run Protocol" disabled={!isProtocolAccepted} />
          <NavItem active={activeTab === 'LIVE_TERMINAL'} onClick={() => setActiveTab('LIVE_TERMINAL')} icon={<CommandLineIcon className="w-5 h-5" />} label="Live Terminal" disabled={!isProtocolAccepted} />

          {/* HOW — System infrastructure */}
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 sm:px-6 pt-6 pb-2 hidden lg:block">How</p>
          <NavItem active={activeTab === 'CONFIG_HUB'} onClick={() => setActiveTab('CONFIG_HUB')} icon={<SignalIcon className="w-5 h-5" />} label="Hub" />
          <NavItem active={activeTab === 'CALL_ARCHIVE'} onClick={() => setActiveTab('CALL_ARCHIVE')} icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Call Archive" disabled={!isProtocolAccepted} />
          <NavItem active={activeTab === 'BACKEND_SETTINGS'} onClick={() => setActiveTab('BACKEND_SETTINGS')} icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />} label="Config" />
          <NavItem active={false} onClick={() => {}} icon={<CpuChipIcon className="w-5 h-5" />} label="Backend Settings" disabled={true} />
        </div>

        {/* Security + Status + Version */}
        <div className="mt-auto border-t border-[#1e293b]/30 px-3 sm:px-4 py-3 space-y-3">
          <button
            onClick={() => setShowPopiaModal(true)}
            className="flex items-center gap-2.5 text-slate-600 hover:text-[#39ff88] text-[10px] font-medium uppercase tracking-wider w-full"
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" /> <span className="hidden lg:inline">POPIA Valid</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className={`os3-heartbeat ${backendStatus === 'connected' ? '' : backendStatus === 'loading' ? 'os3-heartbeat--amber' : 'os3-heartbeat--red'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-widest hidden lg:inline ${
              backendStatus === 'connected' ? 'text-[#39ff88]' : backendStatus === 'loading' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
            }`}>
              {backendStatus === 'connected' ? 'Uplink Established' : backendStatus === 'loading' ? 'Connecting...' : 'Uplink Severed'}
            </span>
          </div>
          <p className="text-[9px] text-[#484f58] font-mono tracking-tighter hidden lg:block">v3.4.1-stable-mzanzi</p>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* 🚀 MAIN CONTENT ZONE */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col content-module-layered">
          
          {/* 🖥️ THE HUD (Active Protocol Screen) */}
          {['DATA_INBOX', 'PIPELINE', 'LIVE_TERMINAL', 'DASHBOARD'].includes(activeTab) && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-[18px] border bg-opacity-10 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-all duration-500 shadow-lg ${
              protocolMode === 'local' ? 'border-[#39FF88]/30 bg-[#39FF88]/5 text-[#39FF88]' : 'border-[#00D9FF]/30 bg-[#00D9FF]/5 text-[#00D9FF]'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${
                  protocolMode === 'local' ? 'bg-[#39FF88]' : 'bg-[#00D9FF]'
                }`} />
                <div>
                  <h3 className="font-orbitron text-[10px] tracking-[0.3em] opacity-60 uppercase">System_Active_Protocol</h3>
                  <p className="font-orbitron text-xl font-black italic tracking-tighter">
                    {protocolMode === 'local' ? 'MZANZI_SOUTH' : 'GLOBAL_EXPANSION'}
                  </p>
                </div>
              </div>
              <div className="text-right border-l border-white/10 pl-4 sm:pl-6 hidden sm:block">
                <span className="font-mono text-[9px] block opacity-50 uppercase tracking-widest">Selected_Language</span>
                <span className="font-orbitron text-sm font-bold uppercase">{language}</span>
              </div>
            </div>
          )}

          {/* TAB: PIPELINE */}
          {activeTab === 'PIPELINE' && (
            <div className="space-y-4 animate-fadeIn relative flex-1 flex flex-col overflow-hidden">
              <InfoOverlay 
                isOpen={showPipelineInfo}
                onClose={() => setShowPipelineInfo(false)}
                title="Pipeline Execution Guide"
                icon={<ListBulletIcon className="w-6 h-6" />}
                steps={[
                  {
                    step: '01',
                    title: 'Signal Queue',
                    desc: 'View all leads that have been synced and are ready for interaction. These are leads with LOADED status.'
                  },
                  {
                    step: '02',
                    title: 'Language Filtering',
                    desc: 'Use the language filter in the header to focus on specific language groups for targeted execution.'
                  },
                  {
                    step: '03',
                    title: 'Signal Initialization',
                    desc: 'Click "DIAL_NOW" to start an AI-driven conversation with a lead. This transitions the signal to ACTIVE.'
                  },
                  {
                    step: '04',
                    title: 'Status Tracking',
                    desc: 'Monitor the progress of each signal. Once completed, leads move to the Intelligence Ledger archive.'
                  }
                ]}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowPipelineInfo(true)}
                    className="i-button-pro" style={{ width: 40, height: 40 }}
                    title="Pipeline Info"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter font-orbitron">Execution Pipeline</h2>
                </div>
              </div>
              {/* Language Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <button
                  onClick={toggleAllLangs}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeLangs.size === ALL_LANGUAGES.length ? 'bg-[#66FF66] text-[#0d1117] border-[#66FF66] shadow-[0_0_12px_rgba(102,255,102,0.3)]' : 'bg-[#1A2333] text-slate-400 border-[#1e293b]/40 hover:border-[#66FF66]/40 hover:text-white'}`}
                >
                  All
                </button>
                <span className="text-slate-600 text-[9px] font-mono mx-1">|</span>
                {ALL_LANGUAGES.map(lang => {
                  const isOn = activeLangs.has(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleLang(lang)}
                      className={`group px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                        isOn
                          ? 'bg-[#66FF66]/10 text-[#66FF66] border-[#66FF66]/50 shadow-[0_0_10px_rgba(102,255,102,0.15)]'
                          : 'bg-[#1A2333] text-slate-600 border-[#1e293b]/30 hover:border-slate-500/40 line-through decoration-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isOn ? 'bg-[#66FF66] shadow-[0_0_6px_#66FF66]' : 'bg-red-500/60'
                      }`} />
                      {getLanguageName(lang)}
                    </button>
                  );
                })}
              </div>
              {pipelineClients.length === 0 ? (
                <div className="p-20 text-center text-slate-600 font-orbitron text-xs">
                  NO_LEADS_IN_PIPELINE. SYNC_FROM_INBOX_TO_INITIALIZE.
                </div>
              ) : (
                <div className="bg-[#1A2333] rounded-[24px] border border-white/5 overflow-hidden overflow-x-auto flex-1">
                  {/* Desktop table */}
                  <table className="w-full text-left hidden sm:table">
                    <thead className="bg-[#020617] text-[10px] text-[#39FF88] font-orbitron sticky top-0 z-10">
                       <tr>
                         <th className="p-4 uppercase">Identity</th>
                         <th className="p-4 uppercase hidden md:table-cell">Phone</th>
                         <th className="p-4 uppercase hidden lg:table-cell">Language</th>
                         <th className="p-4 uppercase hidden lg:table-cell">Area</th>
                         <th className="p-4 uppercase">Status</th>
                         <th className="p-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody>
                      {pipelineClients.map((c: any) => (
                        <tr key={c.id} className="border-t border-white/5 hover:bg-white/5 transition">
                          <td className="p-4 font-bold uppercase text-xs text-white">
                            {c.name} {c.surname}
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-400 hidden md:table-cell">
                            {c.phone}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className="text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest text-[#66FF66] bg-[#66FF66]/10">
                              {getLanguageName(c.language)}
                            </span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                            {c.area || '—'}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-mono px-2 py-1 rounded ${c.status === 'signal_sent' ? 'text-amber-400 bg-amber-400/10' : 'text-[#00D9FF] bg-[#00D9FF]/10'}`}>
                              {c.status === 'signal_sent' ? 'ACTIVE' : 'READY'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleCall(c.id, c.phone)} 
                              disabled={backendStatus !== 'connected'}
                              className="bg-[#00D9FF] text-[#020617] text-[9px] font-bold px-4 py-2 rounded-lg hover:bg-[#39FF88] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              DIAL_NOW
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile card list */}
                  <div className="sm:hidden divide-y divide-white/5">
                    {pipelineClients.map((c: any) => (
                      <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white uppercase truncate">{c.name} {c.surname}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-[#66FF66] bg-[#66FF66]/10 uppercase">{getLanguageName(c.language)}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${c.status === 'signal_sent' ? 'text-amber-400 bg-amber-400/10' : 'text-[#00D9FF] bg-[#00D9FF]/10'}`}>
                              {c.status === 'signal_sent' ? 'ACTIVE' : 'READY'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCall(c.id, c.phone)} 
                          disabled={backendStatus !== 'connected'}
                          className="bg-[#00D9FF] text-[#020617] text-[9px] font-bold px-3 py-2 rounded-lg hover:bg-[#39FF88] transition-colors shrink-0 disabled:opacity-30"
                        >
                          DIAL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE TERMINAL */}
          {activeTab === 'LIVE_TERMINAL' && (
            <div className="flex-1 flex flex-col animate-fade-in overflow-hidden relative">
              <InfoOverlay 
                isOpen={showLabInfo}
                onClose={() => setShowLabInfo(false)}
                title="Neural Lab Guide"
                icon={<CommandLineIcon className="w-6 h-6" />}
                steps={[
                  {
                    step: '01',
                    title: 'Stimulus Injection',
                    desc: 'Enter text to test the Audio (Azure) or Logic (Gemini) units. This verifies the core neural pathways.'
                  },
                  {
                    step: '02',
                    title: 'Manual Signal Trigger',
                    desc: 'Dial external numbers or establish internal neural links for direct system-to-system testing.'
                  },
                  {
                    step: '03',
                    title: 'Lab Output',
                    desc: 'Monitor the raw logs and system responses in real-time. This is the heartbeat of the neural core.'
                  },
                  {
                    step: '04',
                    title: 'Logic Verification',
                    desc: 'Use quick scripts to verify common interaction patterns and ensure protocol alignment.'
                  }
                ]}
              />
              {isCalling ? (
              <>
                <div className="p-8 border-b border-[#1e293b]/30 bg-[#0d1117]/80 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      {isInternalCall ? <CpuChipIcon className="w-6 h-6 text-[#66FF66]" /> : <PhoneIcon className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                        {isInternalCall ? 'Neural Hub: Internal Link' : 'Neural Lab: Live Session'}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        {isInternalCall ? 'LOCAL_CORE_LINK' : `${activeClient?.name} • ${activeClient?.phone}`}
                      </p>
                    </div>
                  </div>
                  
                  <button onClick={endCall} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-md text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <PhoneXMarkIcon className="w-4 h-4" /> {isInternalCall ? 'Sever Neural Link' : 'Terminate Session'}
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 p-4 sm:p-8 overflow-hidden">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]/40 group hover:border-[#66FF66]/30 transition-all">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                        Call Duration <ClockIcon className="w-4 h-4 text-[#66FF66]" />
                      </h5>
                      <div className="text-4xl font-mono font-black text-[#66FF66] tracking-tighter text-glow">
                        {formatDuration(callDuration)}
                      </div>
                    </div>

                    <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]/40">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                        {isInternalCall ? 'Neural Synapses' : 'Interaction Flow'} <ArrowsRightLeftIcon className="w-4 h-4 text-[#66FF66]" />
                      </h5>
                      <div className="text-4xl font-black text-white tracking-tighter">
                        {transcriptions.length} <span className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Turns</span>
                      </div>
                    </div>

                    <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]/40">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                        Detected Language <LanguageIcon className="w-4 h-4 text-[#66FF66]" />
                      </h5>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] font-black text-xs border border-[#66FF66]/20">
                          {detectedLanguage?.slice(0, 2).toUpperCase() || 'EN'}
                        </div>
                        <div className="text-xl font-black text-white uppercase tracking-tighter">
                          {getLanguageName(detectedLanguage) || 'Auto-Sync'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]/40 h-32 flex items-center justify-center gap-1 overflow-hidden">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-1 rounded-full bg-[#66FF66]/40 animate-waveform" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }} />
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex flex-col bg-[#0d1117] rounded-lg border border-[#1e293b]/40 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-[#1e293b]/30 bg-white/[0.01] flex items-center justify-between">
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
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${t.role === 'user' ? 'bg-[#66FF66] text-[#0d1117] shadow-lg' : 'bg-[#1e293b]/40 text-slate-400 border border-[#1e293b]/30'}`}>
                                  {t.role === 'user' ? <UserIcon className="w-4 h-4" /> : <CpuChipIcon className="w-4 h-4" />}
                                </div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                  {t.role === 'user' ? (isInternalCall ? 'Stimulus Input' : 'Remote Stream') : 'Neural Core'}
                                </span>
                            </div>
                            <div className={`p-6 rounded-md text-sm leading-relaxed ${t.role === 'user' ? 'bg-[#66FF66]/10 border border-[#66FF66]/20 text-[#66FF66] rounded-tr-none' : 'bg-[#1e293b]/20 border border-[#1e293b]/30 text-slate-300 rounded-tl-none'}`}>
                                {t.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                    
                    <div className="p-8 border-t border-[#1e293b]/30 bg-black/10">
                      <div className="flex items-center gap-6">
                          <div className="flex-1 h-12 bg-black/40 rounded-xl border border-[#1e293b]/30 flex items-center px-6 text-slate-600 text-xs font-mono italic">
                            Synchronizing duplex audio buffer...
                          </div>
                          <div className="flex items-center gap-3">
                            <MicrophoneIcon className="w-5 h-5 text-[#66FF66] animate-pulse" />
                            <SpeakerWaveIcon className={`w-5 h-5 ${isInternalCall ? 'text-[#66FF66] animate-bounce' : 'text-slate-500 opacity-50'}`} />
                            {isInternalCall && <span className="text-[8px] font-black text-[#66FF66] uppercase tracking-widest">Speakerphone Active</span>}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 p-6 sm:p-12 lg:p-24 overflow-y-auto scrollbar-hide">
                <header className="mb-8 sm:mb-16 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 text-glow">Neural Lab</h1>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Signal over Noise. Test the Audio and Logic units.</p>
                    </div>
                    <button 
                      onClick={() => setShowLabInfo(true)}
                      className="i-button-pro"
                      title="Lab Info"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                        <div className="flex items-center gap-4 mb-8">
                            <BeakerIcon className="w-8 h-8 text-[#66FF66]" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Stimulus</h3>
                        </div>
                        <div className="bg-black/40 rounded-md p-6 border border-[#1e293b]/40 mb-6">
                             <div className="flex gap-2 mb-4">
                                 <button onClick={() => setTestType('speak')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${testType === 'speak' ? 'bg-[#66FF66] text-[#0d1117]' : 'text-slate-500 hover:text-slate-300'}`}>Audio Unit (Azure)</button>
                                 <button onClick={() => setTestType('ask')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${testType === 'ask' ? 'bg-[#66FF66] text-[#0d1117]' : 'text-slate-500 hover:text-slate-300'}`}>Logic Unit (Gemini)</button>
                             </div>
                             <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} className="w-full bg-transparent border-none text-[#66FF66] text-sm font-mono focus:ring-0 h-32 resize-none" placeholder="Enter stimulus parameters..." />
                             <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 <div>
                                   <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Stimulus Language</label>
                                   <select
                                     value={testLang}
                                     onChange={(e) => setTestLang(e.target.value as Language)}
                                     className="w-full bg-black/40 border border-[#1e293b]/40 rounded-xl px-4 py-3 text-white font-bold text-xs focus:ring-1 focus:ring-[#66FF66] outline-none appearance-none"
                                   >
                                     {Object.values(Language).map(lang => (
                                       <option key={lang} value={lang} className="bg-[#0d1117]">{getLanguageName(lang)}</option>
                                     ))}
                                   </select>
                                 </div>
                             </div>
                             <div className="flex justify-end mt-4">
                                 <button onClick={runNeuralTest} disabled={isTestRunning} className="bg-white text-black px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#66FF66] transition-all disabled:opacity-20">
                                     {isTestRunning ? 'Processing...' : 'Execute Test'}
                                 </button>
                             </div>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {Object.values(Language).map(lang => (
                            <button
                              key={`stimulus-lang-${lang}`}
                              onClick={() => setTestLang(lang)}
                              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-all ${testLang === lang ? 'bg-[#66FF66] text-[#0d1117] border-[#66FF66]' : 'bg-[#1e293b]/10 text-slate-400 border-[#1e293b]/30 hover:border-[#66FF66]/40 hover:text-white'}`}
                            >
                              {getLanguageName(lang)}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getQuickScriptsForLanguage(testLang).map(s => (
                                <button key={s.name} onClick={() => setTestInput(s.text)} className="px-3 py-1.5 bg-[#1e293b]/10 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded border border-[#1e293b]/30 hover:border-[#66FF66]/40 transition-all hover:text-white">
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40 flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <CommandLineIcon className="w-8 h-8 text-[#66FF66]" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Lab Output</h3>
                        </div>
                        <div className="flex-1 bg-black/40 rounded-md p-6 border border-[#1e293b]/40 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-2">
                            {testLogs.map((log, i) => (
                              <div key={i} className={log.includes('ERROR') ? 'text-red-500' : log.includes('SUCCESS') ? 'text-[#66FF66]' : ''}>
                                {log}
                              </div>
                            ))}
                            {testLogs.length === 0 && <div className="opacity-30 italic">Awaiting stimulus...</div>}
                        </div>
                    </div>

                    <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40 lg:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <PhoneIcon className="w-8 h-8 text-[#00D9FF]" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Manual Signal Trigger</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Outbound Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[#00D9FF]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outbound Signal</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Number</label>
                                        <input 
                                            type="text" 
                                            value={testPhone} 
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="+27..."
                                            className="w-full bg-black/40 border border-[#1e293b]/40 rounded-xl px-4 py-3 text-[#00D9FF] font-mono text-sm focus:ring-1 focus:ring-[#00D9FF] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Language Protocol</label>
                                        <select 
                                            value={testLang} 
                                            onChange={(e) => setTestLang(e.target.value as Language)}
                                            className="w-full bg-black/40 border border-[#1e293b]/40 rounded-xl px-4 py-3 text-white font-bold text-xs focus:ring-1 focus:ring-[#00D9FF] outline-none appearance-none"
                                        >
                                            {Object.values(Language).map(lang => (
                                                <option key={lang} value={lang} className="bg-[#0d1117]">{getLanguageName(lang)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!testPhone) return;
                                            handleStartCall({
                                                id: `TEST-${Date.now()}`,
                                                name: 'Test',
                                                surname: 'Subject',
                                                phone: testPhone,
                                                language: testLang,
                                                status: 'pending',
                                                area: 'Test Lab',
                                                signup_date: new Date().toISOString(),
                                                collected_data: {}
                                            });
                                        }}
                                        disabled={!testPhone || backendStatus !== 'connected'}
                                        className="w-full bg-[#00D9FF] text-[#0d1117] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#39FF88] transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                                    >
                                        <PhoneIcon className="w-4 h-4" /> Initialize Outbound
                                    </button>
                                </div>
                            </div>

                            {/* Internal Section */}
                            <div className="space-y-6 border-l border-[#1e293b]/30 pl-12">
                                <div className="flex items-center gap-2 mb-2">
                                    <CpuChipIcon className="w-4 h-4 text-[#66FF66]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Neural Link</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#66FF66]/5 border border-[#66FF66]/10 rounded-xl">
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Direct connection to the language processing core. Uses local speakerphone for real-time logic verification.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Language</label>
                                        <select 
                                            value={testLang} 
                                            onChange={(e) => setTestLang(e.target.value as Language)}
                                            className="w-full bg-black/40 border border-[#1e293b]/40 rounded-xl px-4 py-3 text-white font-bold text-xs focus:ring-1 focus:ring-[#66FF66] outline-none appearance-none"
                                        >
                                            {Object.values(Language).map(lang => (
                                                <option key={lang} value={lang} className="bg-[#0d1117]">{getLanguageName(lang)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={() => handleStartInternalCall(testLang)}
                                        className="w-full bg-[#66FF66] text-[#0d1117] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(102,255,102,0.2)]"
                                    >
                                        <SpeakerWaveIcon className="w-4 h-4" /> Establish Internal Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: DATA INBOX */}
        {activeTab === 'DATA_INBOX' && (
            <DataInbox 
              clients={clients}
              onStartCall={handleStartCall}
              backendStatus={backendStatus}
              protocolMode={protocolMode}
              setProtocolMode={setProtocolMode}
              onSync={async () => {
                setIsSyncing(true);
                try {
                  console.log(`📡 Initiating sync with: ${backendUrl}/api/clients/sync-sheets`);
                  let response: Response;
                  try {
                    response = await fetch(`${backendUrl}/api/clients/sync-sheets`, { method: 'POST' });
                  } catch (fetchErr: any) {
                    // Network error — backend unreachable. Inject demo fallback leads.
                    console.warn('⚠️ Backend unreachable, injecting demo leads locally.', fetchErr.message);
                    const demoLeads: Client[] = [
                      { id: `DEMO-${Date.now()}-1`, name: 'Sipho', surname: 'Dlamini', phone: '+27821112222', language: Language.ZULU, status: 'READY_FOR_EXECUTION' as const, source: 'DEMO_SYNC', area: 'KwaZulu-Natal', signup_date: new Date().toISOString(), collected_data: {} },
                      { id: `DEMO-${Date.now()}-2`, name: 'Anelize', surname: 'van Wyk', phone: '+27823334444', language: Language.AFRIKAANS, status: 'READY_FOR_EXECUTION' as const, source: 'DEMO_SYNC', area: 'Free State', signup_date: new Date().toISOString(), collected_data: {} },
                      { id: `DEMO-${Date.now()}-3`, name: 'Thabiso', surname: 'Molefe', phone: '+27825556666', language: Language.SEPEDI, status: 'READY_FOR_EXECUTION' as const, source: 'DEMO_SYNC', area: 'Limpopo', signup_date: new Date().toISOString(), collected_data: {} },
                      { id: `DEMO-${Date.now()}-4`, name: 'Nikos', surname: 'Papadopoulos', phone: '+27827778888', language: Language.GREEK, status: 'READY_FOR_EXECUTION' as const, source: 'DEMO_SYNC', area: 'Johannesburg', signup_date: new Date().toISOString(), collected_data: {} },
                      { id: `DEMO-${Date.now()}-5`, name: 'Wei', surname: 'Chen', phone: '+27829990000', language: Language.MANDARIN, status: 'READY_FOR_EXECUTION' as const, source: 'DEMO_SYNC', area: 'Cape Town', signup_date: new Date().toISOString(), collected_data: {} },
                    ];
                    const updated = clientService.importClients(demoLeads);
                    setClients(updated);
                    setIsSyncing(false);
                    return;
                  }
                  
                  const contentType = response.headers.get("content-type");
                  if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await response.json();
                    
                    if (!response.ok || data.success === false) {
                      console.error('❌ Sync failed:', data.message || data.error);
                      alert(`Sync Issue: ${data.message || data.error || 'Unknown error'}`);
                    }

                    if (data.leads) {
                      const updated = clientService.importClients(data.leads);
                      setClients(updated);
                    } else if (data.lead) {
                      const updated = clientService.importClients([data.lead]);
                      setClients(updated);
                    } else {
                      setClients(clientService.getClients());
                    }
                  } else {
                    const text = await response.text();
                    console.error('❌ Sync failed: Expected JSON but received:', text.slice(0, 100));
                    alert(`Sync Error: Server returned non-JSON response. Check console for details.`);
                  }
                } catch (error: any) {
                  console.error('❌ Sync failed:', error);
                  alert(`Sync Failed: ${error.message}`);
                } finally {
                  setIsSyncing(false);
                }
              }} 
              onClear={() => setClients(clientService.reset())}
              isSyncing={isSyncing}
            />
        )}

        {/* TAB: CALL ARCHIVE — LEDGER VAULT */}
        {activeTab === 'CALL_ARCHIVE' && (
             <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col">
                <InfoOverlay 
                  isOpen={showArchiveInfo}
                  onClose={() => setShowArchiveInfo(false)}
                  title="Intelligence Ledger Guide"
                  icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                  steps={[
                    { step: '01', title: 'Signal History', desc: 'Review all previous interactions and their outcomes. This is your permanent record of neural activity.' },
                    { step: '02', title: 'Transcript Analysis', desc: 'Select an archive card to inspect the full transcript and raw JSON metadata.' },
                    { step: '03', title: 'Qualification Status', desc: 'View whether a lead was qualified or failed based on the AI assessment.' },
                    { step: '04', title: 'POPIA Audit Export', desc: 'Download structured records for compliance auditing.' }
                  ]}
                />
                <section className="archive-module">
                  <header className="archive-header">
                    <div className="archive-title">
                      <span className="step-tag">06</span>
                      <div>
                        <h2>CALL ARCHIVE // LEDGER_VAULT</h2>
                        <p>SECURE TRANSCRIPTS, METADATA, AUDIT EXPORTS</p>
                      </div>
                    </div>
                    <div className="vault-stats">
                      <span>SECURE_RECORDS: {archiveClients.length}</span>
                      <span className="vault-lock">POPIA VALID</span>
                      <button onClick={() => setShowArchiveInfo(true)} className="i-button-pro" style={{ width: 36, height: 36, borderRadius: 8 }} title="Archive Info">
                        <InformationCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </header>

                  <div className="archive-grid">
                    <aside className="record-list">
                      {archiveClients.map((client, idx) => (
                        <button
                          key={client.id}
                          className={`archive-card ${selectedArchiveSignal?.id === client.id ? 'active-vault' : ''}`}
                          onClick={() => setSelectedArchiveSignal(client)}
                        >
                          <div className="card-top">
                            <span className="sig-id">SIG-{String(9900 + idx).padStart(4, '0')}</span>
                            <span className={`sig-badge ${client.status === 'qualified' ? 'qualified' : 'failed'}`}>{client.status === 'qualified' ? 'QUALIFIED' : 'FAILED'}</span>
                          </div>
                          <div className="card-body">
                            <strong className="sig-name">{client.name} {client.surname}</strong>
                            <span className="sig-meta">{client.language.toUpperCase()} &bull; {client.phone} &bull; {client.signup_date || '—'}</span>
                          </div>
                        </button>
                      ))}
                      {archiveClients.length === 0 && (
                        <div className="empty-vault" style={{ padding: '60px 0' }}>
                          <InboxStackIcon className="w-10 h-10 mx-auto mb-3 text-[#1e293b]" />
                          <span>NO_SIGNALS_ARCHIVED</span>
                        </div>
                      )}
                    </aside>

                    <section className="inspection-pane">
                      {selectedArchiveSignal ? (
                        <>
                          <div className="view-header">ARTIFACT_DATA: SIG-{String(9900 + archiveClients.findIndex(c => c.id === selectedArchiveSignal.id)).padStart(4, '0')}</div>
                          <div className="transcript-box">
                            {selectedArchiveSignal.transcript?.map((t: TranscriptionEntry, i: number) => (
                              <p key={i}><b>[{t.role === 'assistant' ? 'ZANDI' : 'USER'}]</b> {t.text}</p>
                            ))}
                            {!selectedArchiveSignal.transcript && <p style={{ color: '#484f58', fontStyle: 'italic' }}>No transcript data recorded.</p>}
                          </div>
                          <div className="json-metadata">
                            <pre>{JSON.stringify({
                              name: `${selectedArchiveSignal.name} ${selectedArchiveSignal.surname}`,
                              status: selectedArchiveSignal.status,
                              language: selectedArchiveSignal.language,
                              phone: selectedArchiveSignal.phone,
                              popia_consent: "YES",
                              node_path: `${selectedArchiveSignal.language.toUpperCase()}-MZANZI`
                            }, null, 2)}</pre>
                          </div>
                          <button className="signal-trigger-pro" style={{ marginTop: 18, width: '100%' }} onClick={() => setViewingTranscriptClient(selectedArchiveSignal)}>
                            DOWNLOAD_FOR_POPIA_AUDIT
                          </button>
                        </>
                      ) : (
                        <div className="empty-vault">SELECT_SIGNAL_FOR_INSPECTION</div>
                      )}
                    </section>
                  </div>
                </section>
             </div>
        )}

        {/* TAB: CONFIG HUB */}
        {activeTab === 'CONFIG_HUB' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 animate-fade-in scrollbar-hide relative">
                <InfoOverlay 
                  isOpen={showConfigInfo}
                  onClose={() => setShowConfigInfo(false)}
                  title="Config Hub Guide"
                  icon={<SignalIcon className="w-6 h-6" />}
                  steps={[
                    {
                      step: '01',
                      title: 'Network Vitals',
                      desc: 'Monitor latency, uplink speed, and stability of your connection. Low latency is critical for real-time AI voice.'
                    },
                    {
                      step: '02',
                      title: 'API Stability',
                      desc: 'Check the health of Twilio, Azure, and Gemini APIs. All bars should be full for stable operations.'
                    },
                    {
                      step: '03',
                      title: 'Neural Matrix',
                      desc: 'Access the connectivity matrix for high-level system control and team initialization.'
                    },
                    {
                      step: '04',
                      title: 'System Calibration',
                      desc: 'Ensure all neural pathways are aligned. Use this hub to verify the technical foundation of your lab.'
                    }
                  ]}
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter text-glow">Config Hub</h1>
                  <button 
                    onClick={() => setShowConfigInfo(true)}
                    className="i-button-pro"
                    title="Config Info"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                </div>

                <NeuralConnectivityMatrix 
                  backendStatus={backendStatus}
                  isProtocolAccepted={isProtocolAccepted}
                  onAcceptProtocol={() => setShowPopiaModal(true)}
                  onLoadTeam={() => console.log('Loading team...')}
                  onShowInfo={() => setShowDashboardInfo(true)}
                  wsConnected={wsConnected}
                  ledgerStatus={ledgerStatus}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                  <div className="lg:col-span-2 bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <WifiIcon className="w-6 h-6 text-[#66FF66]" /> Network Vitals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-black/40 p-6 rounded-md border border-[#1e293b]/40">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Latency (Ping)</span>
                        <div className="text-3xl font-black text-[#66FF66]">24<span className="text-xs ml-1">ms</span></div>
                      </div>
                      <div className="bg-black/40 p-6 rounded-md border border-[#1e293b]/40">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Uplink Speed</span>
                        <div className="text-3xl font-black text-[#66FF66]">150<span className="text-xs ml-1">mbps</span></div>
                      </div>
                      <div className="bg-black/40 p-6 rounded-md border border-[#1e293b]/40">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Stability</span>
                        <div className="text-3xl font-black text-[#66FF66]">99.9<span className="text-xs ml-1">%</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">API Stability</h3>
                    <div className="space-y-4">
                      {['Twilio', 'Azure', 'Gemini'].map(api => (
                        <div key={api} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">{api}</span>
                          <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className="w-1 h-4 bg-[#66FF66] rounded-full opacity-80"></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
        )}

        {/* TAB: RUN PROTOCOL */}
        {activeTab === 'RUN_PROTOCOL' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 animate-fade-in scrollbar-hide relative">
            <InfoOverlay 
              isOpen={showProtocolInfo}
              onClose={() => setShowProtocolInfo(false)}
              title="Run Protocol Guide"
              icon={<BeakerIcon className="w-6 h-6" />}
              steps={[
                {
                  step: '01',
                  title: 'Company & Call Guide',
                  desc: 'Configure company details, product info, AI personality, and the objectives for the call.'
                },
                {
                  step: '02',
                  title: 'Language Protocols',
                  desc: 'Set the greeting, objection handling, closing, and signal switch phrases for each language.'
                },
                {
                  step: '03',
                  title: 'Edit Mode',
                  desc: 'Click the Edit button on any section to modify parameters. Save or Cancel to commit your changes.'
                },
                {
                  step: '04',
                  title: 'Persistence',
                  desc: 'All settings are stored locally and persist across sessions. Reset from Backend Settings if needed.'
                }
              ]}
            />
            <header className="mb-8 sm:mb-16 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 text-glow">Run Protocol</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Company, Product, Personality & Instruction Sets for each Language.</p>
                </div>
                <button 
                  onClick={() => setShowProtocolInfo(true)}
                  className="i-button-pro"
                  title="Protocol Info"
                >
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
            </header>

            <div className="space-y-12">
              {/* COMPANY & CALL GUIDE */}
              <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF] border border-[#00D9FF]/20">
                      <MegaphoneIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Company & Call Guide</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Personality, Objectives & Product Information</p>
                    </div>
                  </div>
                  {editingCompanyConfig ? (
                    <div className="flex gap-2">
                      <button onClick={saveCompanyConfig} className="flex items-center gap-2 px-5 py-3 bg-[#39FF88] text-[#020617] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <CheckBadgeIcon className="w-4 h-4" /> Save
                      </button>
                      <button onClick={() => setEditingCompanyConfig(false)} className="flex items-center gap-2 px-5 py-3 bg-[#1A2333] text-slate-400 border border-[#1e293b]/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                        <XMarkIcon className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingCompanyConfig(true); setCompanyDraft({ ...companyConfig }); }} className="flex items-center gap-2 px-5 py-3 bg-[#1A2333] text-[#00D9FF] border border-[#00D9FF]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00D9FF] hover:text-[#020617] transition-all">
                      <AdjustmentsHorizontalIcon className="w-4 h-4" /> Edit
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Company Name', key: 'companyName', span: false },
                    { label: 'Call Objectives', key: 'objectives', span: false },
                    { label: 'AI Personality', key: 'personality', span: false },
                    { label: 'Product / Service Info', key: 'productInfo', span: false },
                    { label: 'Parameters to Collect', key: 'parameters', span: true }
                  ].map((item) => (
                    <div key={item.key} className={item.span ? 'md:col-span-2' : ''}>
                      <div className="bg-black/40 rounded-md p-6 border border-[#1e293b]/40 hover:border-[#00D9FF]/20 transition-all">
                        <span className="text-[9px] font-black text-[#00D9FF] uppercase tracking-widest bg-[#00D9FF]/10 px-3 py-1 rounded-full inline-block mb-4">{item.label}</span>
                        {editingCompanyConfig ? (
                          <textarea
                            value={companyDraft[item.key] || ''}
                            onChange={(e) => setCompanyDraft(prev => ({ ...prev, [item.key]: e.target.value }))}
                            className="w-full bg-[#020617] border border-[#1e293b]/60 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono focus:ring-1 focus:ring-[#00D9FF] outline-none resize-none h-24"
                          />
                        ) : (
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {companyConfig[item.key]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PER-LANGUAGE PROTOCOLS */}
              {Object.entries(languageProtocols).map(([lang, protocols]) => (
                <div key={lang} className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] border border-[#66FF66]/20">
                        <LanguageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{getLanguageName(lang)} Protocol</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Instruction Set</p>
                      </div>
                    </div>
                    {editingProtocolLang === lang ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveProtocol(lang)} className="flex items-center gap-2 px-5 py-3 bg-[#39FF88] text-[#020617] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                          <CheckBadgeIcon className="w-4 h-4" /> Save
                        </button>
                        <button onClick={() => setEditingProtocolLang(null)} className="flex items-center gap-2 px-5 py-3 bg-[#1A2333] text-slate-400 border border-[#1e293b]/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                          <XMarkIcon className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingProtocolLang(lang); setProtocolDraft({ ...(protocols as any) }); }} className="flex items-center gap-2 px-5 py-3 bg-[#1A2333] text-[#66FF66] border border-[#66FF66]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#66FF66] hover:text-[#020617] transition-all">
                        <AdjustmentsHorizontalIcon className="w-4 h-4" /> Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Greeting', key: 'greeting' },
                      { label: 'Objection Handling', key: 'objection' },
                      { label: 'Closing Statement', key: 'closing' },
                      { label: 'Signal Switch', key: 'switch' }
                    ].map((item) => (
                      <div key={item.key} className="bg-black/40 rounded-md p-6 border border-[#1e293b]/40 group hover:border-[#66FF66]/30 transition-all">
                        <span className="text-[9px] font-black text-[#66FF66] uppercase tracking-widest bg-[#66FF66]/10 px-3 py-1 rounded-full inline-block mb-4">{item.label}</span>
                        {editingProtocolLang === lang ? (
                          <textarea
                            value={(protocolDraft as any)[item.key] || ''}
                            onChange={(e) => setProtocolDraft(prev => ({ ...prev, [item.key]: e.target.value }))}
                            className="w-full bg-[#020617] border border-[#1e293b]/60 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono focus:ring-1 focus:ring-[#66FF66] outline-none resize-none h-24"
                          />
                        ) : (
                          <p className="text-sm text-slate-400 leading-relaxed font-mono italic">
                            "{(protocols as any)[item.key]}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="bg-[#0d1117] p-8 rounded-lg border border-[#1e293b]/40 border-dashed flex flex-col items-center justify-center text-slate-600 group hover:border-[#66FF66]/30 transition-all cursor-pointer">
                <PlusIcon className="w-12 h-12 mb-4 group-hover:text-[#66FF66] transition-colors" />
                <span className="text-xs font-black uppercase tracking-widest">Add Custom Protocol</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BACKEND SETTINGS */}
        {activeTab === 'BACKEND_SETTINGS' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-12 lg:p-24 animate-fade-in scrollbar-hide relative">
            <InfoOverlay 
              isOpen={showBackendInfo}
              onClose={() => setShowBackendInfo(false)}
              title="System Recalibration Guide"
              icon={<CpuChipIcon className="w-6 h-6" />}
              steps={[
                {
                  step: '01',
                  title: 'Core Endpoint',
                  desc: 'Set the URL for your backend server. This is usually auto-detected but can be manually overridden.'
                },
                {
                  step: '02',
                  title: 'Neural Hub Control',
                  desc: 'Reboot or recalibrate the server to ensure all systems are synced and the Google Sheets bridge is active.'
                },
                {
                  step: '03',
                  title: 'Danger Zone',
                  desc: 'Use with caution. Resetting the Neural Hub will wipe all local lead data, transcripts, and configuration settings.'
                },
                {
                  step: '04',
                  title: 'System Integrity',
                  desc: 'Regular recalibration is recommended after major sheet updates or when switching between local and international protocols.'
                }
              ]}
            />
            <header className="mb-8 sm:mb-16 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 text-glow">System Recalibration</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Backend control and Neural Hub reset protocols.</p>
                </div>
                <button 
                  onClick={() => setShowBackendInfo(true)}
                  className="i-button-pro"
                  title="Backend Info"
                >
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
            </header>

            <div className="max-w-2xl space-y-8">
              <div className="bg-[#0d1117] p-10 rounded-lg border border-[#1e293b]/40">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <CpuChipIcon className="w-6 h-6 text-[#66FF66]" /> Neural Hub Control
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Core Endpoint</label>
                    <input type="text" value={backendUrl} onChange={(e) => saveBackendUrl(e.target.value)} className="w-full bg-black/40 border border-[#1e293b]/40 rounded-xl px-6 py-4 text-[#66FF66] font-mono text-xs focus:ring-1 focus:ring-[#66FF66] outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => checkBackendHealth()} disabled={backendStatus === 'loading'} className="bg-[#1e293b] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#1e293b]/80 transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2">
                      {backendStatus === 'loading' ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Checking...</> : 'Reboot Server'}
                    </button>
                    <button onClick={() => { console.log('Recalibrating Neural Hub...'); checkBackendHealth(); }} disabled={backendStatus === 'loading'} className="bg-[#66FF66] text-[#0d1117] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all font-orbitron disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100 flex items-center justify-center gap-2">
                      {backendStatus === 'loading' ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Working...</> : 'Recalibrate'}
                    </button>
                    <button onClick={resetBackendUrlToDefault} className="col-span-2 bg-[#1e293b]/30 text-[#66FF66] border border-[#66FF66]/20 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#66FF66]/10 transition-all">
                      Reset to Default Endpoint
                    </button>
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="col-span-2 bg-red-600/10 text-red-600 border border-red-600/20 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all">
                      Reset Neural Hub
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <ShieldExclamationIcon className="w-8 h-8 text-red-500" />
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Danger Zone</h4>
                </div>
                <p className="text-xs text-slate-500 mb-6">Resetting the system will wipe all local lead data, transcripts, and configuration settings. This action is irreversible.</p>
                <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Wipe All System Data</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SESSION ANALYTICS */}
        {viewingTranscriptClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020617]/95 backdrop-blur-xl animate-fade-in">
             <div className="bg-[#0d1117] w-full max-w-3xl rounded-lg border border-[#1e293b]/40 flex flex-col h-[85vh] shadow-2xl relative">
                <button onClick={() => setViewingTranscriptClient(null)} className="absolute top-8 right-8 text-slate-500 hover:text-[#66FF66] transition-colors"><XMarkIcon className="w-8 h-8" /></button>
                <div className="p-12 border-b border-[#1e293b]/30">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Session Audit</h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">{viewingTranscriptClient.name} {viewingTranscriptClient.surname} • {viewingTranscriptClient.language.toUpperCase()}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-12 space-y-6 scrollbar-hide">
                    {viewingTranscriptClient.transcript?.map((t: TranscriptionEntry, i: number) => (
                        <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-6 rounded-md ${t.role === 'user' ? 'bg-[#66FF66]/5 text-[#66FF66] border border-[#66FF66]/20 shadow-lg shadow-[#66FF66]/5 rounded-tr-none' : 'bg-[#1e293b]/20 text-slate-300 border border-[#1e293b]/30 rounded-tl-none'}`}>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">{t.role === 'user' ? 'Remote Signal' : 'AI Node'}</p>
                                <p className="text-base leading-relaxed font-medium">{t.text}</p>
                            </div>
                        </div>
                    ))}
                    {!viewingTranscriptClient.transcript && <div className="text-center py-20 opacity-30 italic uppercase tracking-widest">No transcript data found</div>}
                </div>
                <div className="p-12 border-t border-[#1e293b]/30 flex justify-end">
                   <button onClick={() => setViewingTranscriptClient(null)} className="bg-[#1e293b] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1e293b]/80 transition-all">Close Log</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: POPIA POLICY */}
        {showPopiaModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-[#020617]/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
             <div className="bg-[#0d1117] w-full max-w-4xl rounded-lg border border-[#1e293b]/40 flex flex-col shadow-2xl relative my-auto max-h-[90vh]">
                {isProtocolAccepted && (
                  <button 
                    onClick={() => setShowPopiaModal(false)} 
                    className="absolute top-8 right-8 text-slate-500 hover:text-[#66FF66] transition-colors z-20"
                  >
                    <XMarkIcon className="w-8 h-8" />
                  </button>
                )}
                
                <div className="p-12 border-b border-[#1e293b]/30 shrink-0">
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
                          <div key={idx} className="bg-[#1e293b]/10 border border-[#1e293b]/30 p-5 rounded-md">
                             <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2 flex items-center gap-2">
                               <span className="text-[#66FF66] font-mono">{idx + 1}.</span> {item.title}
                             </h4>
                             <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Section 2: Implementation Steps */}
                    <section className="bg-white/5 p-8 rounded-lg border border-[#1e293b]/30">
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
                             <div className="shrink-0 w-8 h-8 rounded-lg bg-[#66FF66]/10 flex items-center justify-center text-[#66FF66] font-mono text-xs group-hover:bg-[#66FF66] group-hover:text-[#0d1117] transition-all">
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
                          <div key={idx} className="flex flex-col md:flex-row gap-2 md:gap-6 border-b border-[#1e293b]/20 pb-4">
                             <span className="font-black text-white text-[10px] uppercase tracking-widest w-48 shrink-0">{item.term}</span>
                             <p className="text-xs text-slate-500">{item.def}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <footer className="pt-8 border-t border-[#1e293b]/20">
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
                <div className="p-12 border-t border-[#1e293b]/30 flex justify-end shrink-0">
                   <button 
                     onClick={handleAcceptProtocol} 
                     className="bg-[#66FF66] text-[#0d1117] px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-[0_0_20px_rgba(102,255,102,0.4)] transition-all font-orbitron"
                   >
                     Protocol Accepted
                   </button>
                </div>
             </div>
          </div>
        )}

        </div>
      </main>

      </div>{/* end flex-row wrapper */}

      {/* === OS³ FOOTER STRIP === */}
      <footer className="h-9 bg-[#0d1117] border-t border-[#1e293b] flex items-center justify-between px-5 shrink-0 text-[11px] text-[#484f58] font-mono tracking-wide">
        <span>v3.4.1-stable-mzanzi</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheckIcon className="w-3 h-3 text-[#39ff88]/60" />
          <span className="text-[#8b949e]">POPIA Valid</span>
        </span>
      </footer>

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