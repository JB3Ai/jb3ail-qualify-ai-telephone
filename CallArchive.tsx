import React from 'react';
import { Client, TranscriptionEntry } from './types';
import {
  InboxStackIcon,
} from '@heroicons/react/24/solid';
import './CallArchive.css';

interface CallArchiveProps {
  archiveClients: Client[];
  selectedSignal: Client | null;
  onSelectSignal: (client: Client) => void;
  onDownload: (client: Client) => void;
  onShowInfo: () => void;
}

export const CallArchive: React.FC<CallArchiveProps> = ({
  archiveClients,
  selectedSignal,
  onSelectSignal,
  onDownload,
  onShowInfo,
}) => {
  return (
    <section className="flex flex-col min-h-[600px] gap-4 p-0 sm:p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-4 p-4 bg-[#0f1319] rounded-lg border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-gray-800 px-2 py-1 rounded text-xs text-white font-mono">06</div>
          <div>
            <h2 className="text-white font-bold tracking-widest">CALL ARCHIVE // LEDGER_VAULT</h2>
            <p className="text-gray-500 text-xs">SECURE TRANSCRIPTS, METADATA, AUDIT EXPORTS</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400">SECURE_RECORDS: {archiveClients.length}</span>
          <span className="text-green-500">POPIA VALID</span>
          <button
            onClick={onShowInfo}
            className="bg-[#0f1319] border border-[#1f2937] p-2 rounded-lg shrink-0 flex items-center justify-center transition-colors hover:bg-gray-800"
            title="Archive Info"
          >
            <span className="text-green-500 font-bold text-lg leading-none">ℹ️</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4">
        <aside className="w-full md:w-[380px] shrink-0 overflow-y-auto flex flex-col gap-2 pb-4">
          {archiveClients.map((client, idx) => (
            <button
              key={client.id}
              className={`archive-card ${selectedSignal?.id === client.id ? 'active-vault' : ''}`}
              onClick={() => onSelectSignal(client)}
            >
              <div className="card-top">
                <span className="sig-id">SIG-{String(9900 + idx).padStart(4, '0')}</span>
                <span className={`sig-badge ${client.status === 'qualified' ? 'qualified' : 'failed'}`}>
                  {client.status === 'qualified' ? 'QUALIFIED' : 'FAILED'}
                </span>
              </div>
              <div className="card-body">
                <strong className="sig-name">{client.name} {client.surname}</strong>
                <span className="sig-meta">
                  {client.language.toUpperCase()} &bull; {client.phone} &bull; {client.signup_date || '—'}
                </span>
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

        <section className="flex-1 overflow-y-auto bg-[#080a0f] border border-gray-800 rounded-lg flex flex-col min-h-[400px] min-w-0">
          {selectedSignal ? (
            <>
              <div className="view-header">
                ARTIFACT_DATA: SIG-{String(9900 + archiveClients.findIndex(c => c.id === selectedSignal.id)).padStart(4, '0')}
              </div>
              <div className="transcript-box">
                {selectedSignal.transcript?.map((t: TranscriptionEntry, i: number) => (
                  <p key={i}><b>[{t.role === 'model' ? 'ZANDI' : 'USER'}]</b> {t.text}</p>
                ))}
                {!selectedSignal.transcript && (
                  <p style={{ color: '#484f58', fontStyle: 'italic' }}>No transcript data recorded.</p>
                )}
              </div>
              <div className="json-metadata">
                <pre>{JSON.stringify({
                  name: `${selectedSignal.name} ${selectedSignal.surname}`,
                  status: selectedSignal.status,
                  language: selectedSignal.language,
                  phone: selectedSignal.phone,
                  popia_consent: "YES",
                  node_path: `${selectedSignal.language.toUpperCase()}-MZANZI`
                }, null, 2)}</pre>
              </div>
              <button
                className="signal-trigger-pro"
                style={{ marginTop: 18, width: '100%' }}
                onClick={() => onDownload(selectedSignal)}
              >
                DOWNLOAD_FOR_POPIA_AUDIT
              </button>
            </>
          ) : (
            <div className="empty-vault flex-1 flex items-center justify-center">
              <span className="text-gray-600 tracking-widest font-mono">$ELECT_SIGNAL_FOR_INSPECTION</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
};
