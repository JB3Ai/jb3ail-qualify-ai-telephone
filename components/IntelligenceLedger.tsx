import React from 'react';
import { Clock, Eye, CheckCircle } from 'lucide-react';

interface Log {
    id: string;
    target: string;
    time: string;
    duration: string;
    status: string;
    transcript: string;
    summary?: {
        problem: string;
        system: string;
        outcome: string;
    };
}

interface IntelligenceLedgerProps {
    logs: Log[];
    onViewTranscript: (log: Log) => void;
}

export const IntelligenceLedger: React.FC<IntelligenceLedgerProps> = ({ logs, onViewTranscript }) => {
    return (
        <div className="h-full flex flex-col gap-6 animate-fadeIn pb-20">
            <h2 className="text-2xl font-orbitron text-jb-frost pb-4 border-b border-jb-green/10">MISSION ARCHIVES</h2>
            <div className="flex-1 bg-jb-steel rounded-jb-card border border-jb-green/20 overflow-hidden overflow-y-auto custom-scrollbar relative p-4 space-y-4">
                {/* Grainy Noise Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                {logs.length === 0 ? (
                    <div className="p-12 text-center text-jb-frost/30 font-orbitron flex flex-col items-center justify-center h-full">NO MISSION LOGS RECORDED</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className={`bg-jb-midnight relative rounded-jb-card p-6 border transition-all hover:shadow-lg group ${log.status === 'Signal Detected' ? 'border-jb-cyan/40 shadow shadow-jb-cyan/5' : 'border-jb-green/10'}`}>

                            {/* Status Badge */}
                            {log.status === 'Signal Detected' && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-jb-cyan text-jb-midnight font-orbitron text-[10px] font-bold rounded-bl-xl flex items-center gap-1">
                                    Signal Locked
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="font-orbitron text-lg text-jb-green mb-1">{log.target}</div>
                                    <div className="flex items-center gap-4 text-xs font-mono text-jb-frost/50">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {log.time}</span>
                                        <span>DURATION: {log.duration}</span>
                                    </div>
                                </div>
                            </div>

                            {/* PROBLEM -> SYSTEM -> OUTCOME GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                                <div className="bg-jb-steel/50 p-3 rounded-xl border border-jb-frost/5 relative overflow-hidden group/item">
                                    <div className="text-[10px] font-orbitron text-jb-frost/40 mb-1">PROBLEM</div>
                                    <div className="text-xs text-jb-frost/80 font-inter leading-relaxed">{log.summary?.problem || "Processing..."}</div>
                                </div>
                                <div className="bg-jb-steel/50 p-3 rounded-xl border border-jb-frost/5 relative overflow-hidden group/item">
                                    <div className="text-[10px] font-orbitron text-jb-frost/40 mb-1">SYSTEM</div>
                                    <div className="text-xs text-jb-frost/80 font-inter leading-relaxed">{log.summary?.system || "Deploying..."}</div>
                                </div>
                                <div className="bg-jb-steel/50 p-3 rounded-xl border border-jb-green/10 relative overflow-hidden group/item hover:border-jb-green/30 transition-colors">
                                    <div className="absolute inset-0 bg-jb-green/5 opacity-50 group-hover/item:opacity-80 transition-opacity"></div>
                                    <div className="text-[10px] font-orbitron text-jb-green mb-1 relative z-10">OUTCOME</div>
                                    <div className="text-xs text-jb-frost font-inter leading-relaxed relative z-10">{log.summary?.outcome || "Pending..."}</div>
                                </div>
                            </div>

                            <button onClick={() => onViewTranscript(log)} className="w-full py-3 border border-jb-frost/10 rounded-xl text-jb-frost/60 text-xs font-orbitron hover:bg-jb-frost/5 hover:text-jb-frost transition flex items-center justify-center gap-2 group-hover:border-jb-cyan/20 group-hover:text-jb-cyan">
                                <Eye size={14} /> VIEW FULL TRANSCRIPT
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
