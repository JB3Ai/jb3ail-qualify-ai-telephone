import React from 'react';
import { Client, TranscriptionEntry } from './types';
import {
  InboxStackIcon,
  InformationCircleIcon,
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
    <section className="archive-module h-full flex flex-col">
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
          <button
            onClick={onShowInfo}
            className="i-button-pro"
            style={{ width: 36, height: 36, borderRadius: 8 }}
            title="Archive Info"
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="archive-grid flex flex-col md:flex-row h-full overflow-y-auto">
        <aside className="record-list w-full md:w-1/3 min-h-[300px]">
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

        <section className="inspection-pane w-full md:w-2/3">
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
            <div className="empty-vault">SELECT_SIGNAL_FOR_INSPECTION</div>
          )}
        </section>
      </div>
    </section>
  );
};
