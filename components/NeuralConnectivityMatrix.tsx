import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

interface NeuralConnectivityMatrixProps {
    onOpenLegal: () => void;
    status?: { twilio: string; azure: string; gemini: string; sheets: string };
}

export const NeuralConnectivityMatrix: React.FC<NeuralConnectivityMatrixProps> = ({ onOpenLegal, status }) => {
    const services = [
        { name: 'TWILIO GATEWAY', status: status?.twilio || 'ONLINE' },
        { name: 'AZURE NEURAL', status: status?.azure || 'ONLINE' },
        { name: 'GEMINI CORE', status: status?.gemini || 'ONLINE' },
        { name: 'GOOGLE SHEETS', status: status?.sheets || 'SYNCED' }
    ];

    return (
        <div className="bg-jb-midnight p-6 rounded-jb-card border border-jb-steel shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-jb-frost font-orbitron tracking-widest text-sm flex items-center gap-2">
                    <Activity size={16} className="text-jb-green animate-pulse" />
                    NEURAL CONNECTIVITY MATRIX
                </h2>
                <button
                    onClick={onOpenLegal}
                    className="bg-jb-steel border border-jb-cyan/30 hover:border-jb-cyan text-jb-cyan px-4 py-2 rounded-xl text-xs font-orbitron font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                >
                    <ShieldCheck size={14} /> SECURITY & POPIA
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service, i) => (
                    <div key={i} className="bg-jb-steel border border-jb-green/20 rounded-jb-card p-4 flex flex-col justify-between relative group hover:border-jb-green/50 transition-all cursor-default shadow-lg shadow-jb-green/5 hover:shadow-jb-green/20 min-h-[100px]">
                        <span className="font-orbitron text-xs tracking-widest text-jb-frost/80 group-hover:text-jb-green transition-colors mb-2">{service.name}</span>
                        <div className="flex items-center gap-2 mt-auto">
                            <div className="w-2 h-2 rounded-full bg-jb-green shadow-[0_0_10px_#39FF88] animate-pulse"></div>
                            <span className="text-[10px] font-mono text-jb-green opacity-80 tracking-wider">{service.status}</span>
                        </div>
                        {/* Soft Glow overlay on hover */}
                        <div className="absolute inset-0 bg-jb-green/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-jb-card pointer-events-none"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
