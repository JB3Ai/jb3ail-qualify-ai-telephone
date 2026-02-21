import React from 'react';
import { RefreshCw, Lock, Globe } from 'lucide-react';

import { LanguageConfig } from '../types';

interface DataInboxProps {
    languages: LanguageConfig[];
    selectedLang: string;
    onSelectLang: (code: string) => void;
    onImport: () => void;
    isLocked: boolean;
}

export const DataInbox: React.FC<DataInboxProps> = ({ languages, selectedLang, onSelectLang, onImport, isLocked }) => {
    return (
        <div className="bg-jb-midnight p-4 rounded-jb-card border border-jb-green/20">
            <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-jb-green" />
                <label className="text-xs text-jb-frost/60 font-inter font-bold tracking-widest uppercase">Select Protocol</label>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-4">
                {languages.map(l => (
                    <button
                        key={l.code}
                        onClick={() => onSelectLang(l.code)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-xs font-orbitron flex items-center gap-2 ${selectedLang === l.code ? 'bg-jb-green/10 border-jb-green text-jb-green shadow-lg shadow-jb-green/10' : 'border-jb-frost/10 text-jb-frost/50 hover:border-jb-frost/30 hover:text-jb-frost'}`}
                    >
                        {selectedLang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-jb-green animate-pulse" />}
                        {l.name}
                    </button>
                ))}
            </div>

            <button
                onClick={onImport}
                disabled={isLocked}
                className={`w-full py-4 font-orbitron font-bold text-xs rounded-jb-card flex items-center justify-center gap-2 transition shadow-lg ${!isLocked ? 'bg-neural-gradient text-jb-midnight hover:opacity-90 shadow-jb-green/20' : 'bg-jb-steel border border-jb-frost/10 text-jb-frost/20 cursor-not-allowed'}`}
            >
                {!isLocked ? <><RefreshCw size={14} /> INJECT LEADS</> : <><Lock size={14} /> SYSTEM LOCKED</>}
            </button>
        </div>
    );
};
