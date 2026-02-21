import React from 'react';
import { Activity, CheckCircle } from 'lucide-react';

import { Client } from '../types';

interface ExecutionPipelineProps {
    clients: Client[];
    onInitialize: (id: string) => void;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({ clients, onInitialize }) => {
    return (
        <div className="h-full flex flex-col gap-6 animate-fadeIn pb-20">
            <h2 className="text-2xl font-orbitron text-jb-frost pb-4 border-b border-jb-green/10">EXECUTION PIPELINE</h2>

            {clients.length === 0 ? (
                <div className="p-12 text-center text-jb-frost/30 font-orbitron border border-dashed border-jb-green/10 rounded-jb-card flex flex-col items-center justify-center gap-4 h-full">
                    <div className="w-16 h-16 rounded-full bg-jb-green/5 flex items-center justify-center mb-2">
                        <Activity className="text-jb-green/20" size={32} />
                    </div>
                    NO LEADS IN QUEUE
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 relative">
                    {/* Glow bloom edge hint */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-jb-green/20 to-transparent opacity-50 pointer-events-none"></div>

                    {clients.map((c) => (
                        <div key={c.id} className="bg-jb-steel border border-jb-frost/10 rounded-jb-card p-6 flex justify-between items-center group hover:border-jb-green/40 hover:shadow-[0_0_30px_rgba(57,255,136,0.1)] transition-all">
                            <div>
                                <div className="font-orbitron text-xl text-white mb-2 group-hover:text-jb-green transition-colors">{c.name}</div>
                                <div className="flex items-center gap-4 text-xs font-mono text-jb-frost/50">
                                    <span className="px-2 py-1 bg-jb-midnight rounded border border-jb-frost/10">{c.phone}</span>
                                    <span className="text-jb-green flex items-center gap-1"><CheckCircle size={10} /> VERIFIED</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onInitialize(c.id)}
                                className="px-6 py-3 bg-jb-green text-jb-midnight font-orbitron font-bold text-xs rounded-xl hover:shadow-[0_0_20px_rgba(57,255,136,0.6)] hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Activity size={16} /> INITIALIZE
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
