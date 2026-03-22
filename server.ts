import * as dotenv from 'dotenv';
dotenv.config({ override: true });

// --- STARTUP DIAGNOSTICS (helps debug Azure App Service issues) ---
console.log(`[STARTUP] Node ${process.version} | ENV=${process.env.NODE_ENV} | PORT=${process.env.PORT} | CWD=${process.cwd()}`);
console.log(`[STARTUP] TWILIO_SID=${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING'} | AZURE_KEY=${process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING'} | SPEECH=${process.env.SPEECH_KEY ? 'SET' : 'MISSING'}`);

import express from 'express';
import { createServer } from 'http';
import Twilio from 'twilio';
import cors from 'cors'; // Added CORS for frontend-backend communication
import { voiceService } from './services/voiceService.js';
import { aiService } from './services/azureOpenAiService.js';
import { clientService } from './services/clientService.js';
import { google } from 'googleapis';
import { Language } from './types';
// Fix: Import Buffer explicitly for Node.js environments where it might not be globally available in the TypeScript context
import { Buffer } from 'buffer';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

import path from 'path';
import fs from 'fs';
import * as appInsights from 'applicationinsights';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

// Only initialise Application Insights when the connection string is configured
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .start();
}

const telemetryClient = appInsights.defaultClient ?? null;

// __dirname is provided natively in CommonJS modules (no declaration needed)

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize WebSocket Server for live terminal uplink + Twilio Media Streams
const wss = new WebSocketServer({ server, path: '/ws' });
let wsClients: WebSocket[] = [];

// Separate WebSocket server for Twilio Media Streams (Node 08: Backend Stream Logic)
const twilioWss = new WebSocketServer({ server, path: '/media-stream' });

// ── CHUNK_SIZE_MS: 320ms at 8kHz mu-law = 2560 bytes per chunk ────────────────
// This matches Twilio's preferred inbound chunk size and minimises Jitter Buffer
// artefacts on SA networks while staying well under the 24ms latency target.
const CHUNK_SIZE_MS = 320;
const MULAW_SAMPLE_RATE = 8000;
const CHUNK_SIZE_BYTES = Math.floor((MULAW_SAMPLE_RATE * CHUNK_SIZE_MS) / 1000); // 2560

twilioWss.on('connection', (socket, req) => {
  let streamSid: string | null = null;
  broadcastLog('INFO', `📡 TWILIO_MEDIA_STREAM_CONNECTED: ${req.socket.remoteAddress}`);

  socket.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.event === 'start') {
        streamSid = msg.start?.streamSid ?? null;
        const callSid = msg.start?.callSid ?? 'unknown';
        broadcastLog('INFO', `▶️  STREAM_START: sid=${streamSid} call=${callSid}`);
      }

      if (msg.event === 'stop') {
        broadcastLog('INFO', `⏹️  STREAM_STOP: sid=${streamSid}`);
        streamSid = null;
      }

    } catch (err: any) {
      broadcastLog('WARN', `STREAM_PARSE_ERROR: ${err?.message}`);
    }
  });

  socket.on('close', () => {
    broadcastLog('INFO', `🔌 TWILIO_MEDIA_STREAM_CLOSED: sid=${streamSid}`);
  });
});

/**
 * Streams a mu-law audio buffer back to Twilio in 320ms chunks.
 * Each chunk is base64-encoded and sent as a Twilio media event.
 * Telemetry is broadcast to the Live Terminal (Node 05) per chunk.
 */
async function streamAudioToTwilio(socket: WebSocket, streamSid: string, audioBuffer: Uint8Array): Promise<void> {
  return new Promise((resolve) => {
    let offset = 0;

    function sendNextChunk() {
      if (socket.readyState !== WebSocket.OPEN || offset >= audioBuffer.length) {
        resolve();
        return;
      }

      const chunk = audioBuffer.slice(offset, offset + CHUNK_SIZE_BYTES);
      offset += CHUNK_SIZE_BYTES;

      const payload = Buffer.from(chunk).toString('base64');
      socket.send(JSON.stringify({
        event: 'media',
        streamSid,
        media: { payload },
      }));

      // Telemetry to Node 05 (Live Terminal)
      broadcastLog('INFO', `UPLINK_BUFFER_SENT: ${CHUNK_SIZE_MS}ms`);

      // Schedule next chunk at the playback rate to avoid flooding the buffer
      setTimeout(sendNextChunk, CHUNK_SIZE_MS);
    }

    sendNextChunk();
  });
}

wss.on('connection', (ws) => {
  wsClients.push(ws);
  ws.send(JSON.stringify({ type: 'SYSTEM', message: '🛰️ LIVE_TERMINAL_UPLINK_ESTABLISHED' }));
  broadcastLog('INFO', `📡 ACTIVE_CONNECTIONS: ${wsClients.length}`);

  ws.on('close', () => {
    wsClients = wsClients.filter(c => c !== ws);
  });
});

// ── OS³ Fast-Stream: Token Streamer & Async TTS Dispatcher ───────────────────
// Uses an EventEmitter to trigger TTS the moment a sentence is ready,
// running concurrently alongside the LLM stream for ultra-low latency.
const ttsEmitter = new EventEmitter();

async function streamNeuralResponse(
  userSpeech: string,
  systemPrompt: string,
  streamSid: string,
  ws: WebSocket,
  callLang: string
): Promise<string> {
  let tokenBuffer = '';
  let fullResponse = '';

  try {
    for await (const token of aiService.streamResponse(userSpeech, systemPrompt)) {
      tokenBuffer += token;
      fullResponse += token;

      // THE TRIGGER: If the token is punctuation, dispatch the chunk immediately!
      if (token.match(/[.!?,;:\n]/)) {
        const chunkToSpeak = tokenBuffer.trim();
        if (chunkToSpeak.length > 2) {
          console.log(`[OS³ FAST-STREAM] Dispatched Chunk: "${chunkToSpeak}"`);
          ttsEmitter.emit('speak_chunk', { text: chunkToSpeak, streamSid, ws, locale: callLang });
        }
        tokenBuffer = '';
      }
    }

    // FLUSH: If the AI finishes but didn't end with punctuation, send the rest
    if (tokenBuffer.trim().length > 0) {
      console.log(`[OS³ FAST-STREAM] Dispatched Final Chunk: "${tokenBuffer.trim()}"`);
      ttsEmitter.emit('speak_chunk', { text: tokenBuffer.trim(), streamSid, ws, locale: callLang });
    }
  } catch (error) {
    console.error('[OS³ ERROR] LLM Streaming Failed:', error);
  }

  return fullResponse;
}

// ── Async TTS Dispatcher — fires concurrently alongside the LLM ──────────────
ttsEmitter.on('speak_chunk', async ({ text, streamSid, ws, locale }: { text: string; streamSid: string; ws: WebSocket; locale: string }) => {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    const audioBuffer = await voiceService.generateAudio(text, { format: 'mulaw', language: locale });
    await streamAudioToTwilio(ws, streamSid, audioBuffer);
    broadcastLog('INFO', `[FAST-STREAM TTS] Chunk sent: "${text.slice(0, 40)}..."`);
  } catch (err: any) {
    console.error('[OS³ TTS ERROR]:', err?.message);
  }
});

// ── /api/twilio/stream — Zero-Latency WebSocket Bridge ───────────────────────
// Azure TTS → raw mu-law in RAM → base64 → Twilio, no disk I/O
const streamWss = new WebSocketServer({ server, path: '/api/twilio/stream' });

streamWss.on('connection', (ws) => {
  let streamSid = '';
  let callSid   = '';
  let callLang  = 'en-ZA';
  let isBusy    = false;

  // ── 1. Azure Speech SDK ear: PushStream for 8kHz 16-bit PCM ───────────────
  // SDK v1.48 does not expose getCompressedFormat/AudioStreamContainerFormat.
  // Twilio sends 8kHz 8-bit mu-law; we decode to 16-bit PCM before each write.
  const pushStream = sdk.AudioInputStream.createPushStream(
    sdk.AudioStreamFormat.getWaveFormatPCM(8000, 16, 1)
  );
  const speechCfg = sdk.SpeechConfig.fromSubscription(
    (process.env.SPEECH_KEY    || '').trim(),
    (process.env.SPEECH_REGION || '').trim().toLowerCase()
  );
  let recognizer: sdk.SpeechRecognizer | null = null;

  // ── 2. TTS → Twilio ────────────────────────────────────────────────────────
  const sendAudioToTwilio = async (textToSpeak: string, locale: string) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      const audioBuffer = await voiceService.generateAudio(textToSpeak, { format: 'mulaw', language: locale });
      await streamAudioToTwilio(ws, streamSid, audioBuffer);
      ws.send(JSON.stringify({
        event: 'mark',
        streamSid,
        mark: { name: 'Mzanzi_Engine_Chunk_Complete' },
      }));
      broadcastLog('INFO', `[STREAM_BRIDGE] Audio sent: "${textToSpeak.slice(0, 40)}..."`);
    } catch (err: any) {
      broadcastLog('ERROR', `[STREAM_BRIDGE] Synthesis failed: ${err?.message}`);
    }
  };

  // ── 3. Neural loop: fires on each recognised phrase ────────────────────────
  const onRecognized = async (_s: unknown, e: sdk.SpeechRecognitionEventArgs) => {
    if (e.result.reason !== sdk.ResultReason.RecognizedSpeech) return;
    if (isBusy) return;
    isBusy = true;

    const userSpeech = e.result.text.trim();
    if (!userSpeech) { isBusy = false; return; }
    broadcastLog('INFO', `[STREAM_BRIDGE] STT: "${userSpeech}"`);

    try {
      if (callSid && activeCalls.has(callSid)) {
        activeCalls.get(callSid)!.aiConversation.push(`User: ${userSpeech}`);
      }

      const callMetaForPrompt = callSid ? activeCalls.get(callSid) : undefined;
      const systemPrompt = buildSystemPrompt(callLang, callMetaForPrompt);

      // ── OS³ Fast-Stream: LLM tokens stream → punctuation-chunked TTS ──────
      const aiResponse = await streamNeuralResponse(userSpeech, systemPrompt, streamSid, ws, callLang);

      if (callSid && activeCalls.has(callSid)) {
        activeCalls.get(callSid)!.aiConversation.push(`AI: ${aiResponse}`);
      }
      broadcastLog('INFO', `[STREAM_BRIDGE] AI: "${aiResponse.slice(0, 80)}"`);

      const completionKeywords = ['verified', 'qualified', 'thank you for your time', 'goodbye', 'have a great day', 'call complete'];
      let outputContract: { status?: string; reasoning?: string; interest_level?: string; popia_consent?: string } | null = null;
      const jsonMatch = aiResponse.match(/\{[\s\S]*"status"\s*:\s*"(QUALIFIED|FAILED)"[\s\S]*\}/);
      if (jsonMatch) { try { outputContract = JSON.parse(jsonMatch[0]); } catch { /* keyword fallback */ } }
      const isCallComplete = !!outputContract || completionKeywords.some(kw => aiResponse.toLowerCase().includes(kw));

      // Audio already dispatched chunk-by-chunk via ttsEmitter during streaming

      if (isCallComplete && callSid) {
        const callMeta = activeCalls.get(callSid);
        const status = outputContract?.status || (aiResponse.toLowerCase().includes('qualified') ? 'QUALIFIED' : 'COMPLETED');
        const ledgerOutput = outputContract
          ? `${outputContract.reasoning || ''} | Interest: ${outputContract.interest_level || 'N/A'} | POPIA: ${outputContract.popia_consent || 'N/A'}`
          : callMeta?.aiConversation.join(' | ') || aiResponse;
        logCallToIntelligenceLedger(callMeta?.phone || '', status, ledgerOutput, callSid)
          .catch(err => broadcastLog('ERROR', `[STREAM_BRIDGE] Ledger failed: ${err.message}`));
        recognizer?.stopContinuousRecognitionAsync();
        pushStream.close();
        ws.close();
      }
    } catch (err: any) {
      broadcastLog('ERROR', `[STREAM_BRIDGE] Pipeline error: ${err?.message}`);
    } finally {
      isBusy = false;
    }
  };

  // ── 4. Twilio message handler ──────────────────────────────────────────────
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.event === 'start') {
        streamSid = msg.start?.streamSid ?? '';
        callSid   = msg.start?.callSid   ?? '';
        console.log('[OS³] Stream Started. Extracting telemetry...');

        // 1. Extract custom parameters injected via <Parameter> tags in TwiML
        const customParams = msg.start?.customParameters || {};
        const mode = customParams.appMode || 'OPERATOR';
        const demoConfig = {
          fullName: customParams.fullName || '',
          company: customParams.company || '',
          objective: customParams.objective || '',
          persona: customParams.persona || '',
          language: customParams.language || '',
        };

        // Sync into activeCalls so onRecognized / buildSystemPrompt can reference it
        if (callSid) {
          const existing = activeCalls.get(callSid);
          if (existing) {
            existing.mode = mode;
            existing.demoConfig = demoConfig;
            if (demoConfig.language && normalizeDemoLanguage(demoConfig.language) !== 'auto') {
              existing.language = normalizeDemoLanguage(demoConfig.language);
            }
          }
        }

        callLang = (demoConfig.language && normalizeDemoLanguage(demoConfig.language) !== 'auto' && demoConfig.language !== '')
          ? normalizeDemoLanguage(demoConfig.language)
          : (callSid && activeCalls.get(callSid)?.language) || 'en-ZA';

        console.log(`[OS³] Agent Persona Locked: ${demoConfig.company || '—'} | ${demoConfig.objective || '—'} | mode=${mode}`);

        // Start continuous recognition for this call's language
        speechCfg.speechRecognitionLanguage = callLang;
        recognizer = new sdk.SpeechRecognizer(speechCfg, sdk.AudioConfig.fromStreamInput(pushStream));
        recognizer.recognized = onRecognized;
        recognizer.startContinuousRecognitionAsync(
          () => broadcastLog('INFO', `[STREAM_BRIDGE] Recognizer started: ${streamSid} lang=${callLang} mode=${mode}`),
          (err) => broadcastLog('ERROR', `[STREAM_BRIDGE] Recognizer failed: ${String(err)}`)
        );

        // Language-appropriate greeting
        const greetProtocol = LANGUAGE_PROTOCOLS[callLang] || LANGUAGE_PROTOCOLS['en-ZA'];
        if (greetProtocol.greeting) await sendAudioToTwilio(greetProtocol.greeting, callLang);
      }

      if (msg.event === 'media') {
        if (isBusy) return; // don't feed STT while Zandi is speaking
        const mulaw = Buffer.from(msg.media.payload, 'base64');
        // Decode 8-bit mu-law → 16-bit linear PCM for the push stream
        const pcm = Buffer.alloc(mulaw.length * 2);
        for (let i = 0; i < mulaw.length; i++) pcm.writeInt16LE(mulawTo16Bit(mulaw[i]), i * 2);
        pushStream.write(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength) as ArrayBuffer);
      }

      if (msg.event === 'stop') {
        broadcastLog('INFO', `[STREAM_BRIDGE] Stop: ${streamSid}`);
        recognizer?.stopContinuousRecognitionAsync();
        pushStream.close();
      }
    } catch (err: any) {
      broadcastLog('WARN', `[STREAM_BRIDGE] Parse error: ${err?.message}`);
    }
  });

  (ws as any).sendAudioToTwilio = sendAudioToTwilio;

  ws.on('close', () => {
    recognizer?.stopContinuousRecognitionAsync();
    broadcastLog('INFO', `[STREAM_BRIDGE] Disconnected: ${streamSid}`);
  });
});

/**
 * Broadcasts logs to the React Frontend via WebSocket
 */
function broadcastLog(type: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM', message: string) {
  const payload = JSON.stringify({ type, message, timestamp: new Date().toLocaleTimeString() });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

// Twilio WebSocket live client alias (used by streamAudioToTwilio)
function resolveFrontendDistDir() {
  const candidates = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'dist')
  ];

  return candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
}

// Restrict CORS to known frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://jb3ail-qualify-ai-telephone.onrender.com',
  'https://jb3ai.com',
  'https://www.jb3ai.com'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Twilio webhook callbacks, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}) as any);
app.use(express.json() as any);
app.use(express.urlencoded({ extended: true }) as any);

// Request Logger - CRITICAL for debugging
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// Lazy Twilio client — only initialised when actually needed (not at startup)
let _twilioClient: ReturnType<typeof Twilio> | null = null;
function getTwilioClient() {
  if (!_twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured');
    _twilioClient = Twilio(sid, token);
  }
  return _twilioClient;
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🚀 JB³Ai Neural Hub Backend is Online!' });
});

// 1.1 Compliance Logging
app.post('/api/log-compliance', (req, res) => {
  console.log('📜 POPIA Compliance Signal Logged');
  res.json({ success: true, message: 'Compliance accepted and logged.' });
});

/**
 * AUTO-RECOVERY AUTHENTICATION HUB
 * Implements persistent session monitoring and re-initialization.
 */
let cachedAuth: any = null;

const parseGoogleCredentials = (rawValue: string) => {
  const raw = rawValue.trim();

  const tryParseJson = (value: string) => {
    const parsed = JSON.parse(value);
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
  };

  const normalizePrivateKey = (credentials: any) => {
    if (credentials?.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return credentials;
  };

  try {
    return normalizePrivateKey(tryParseJson(raw));
  } catch {
    // Continue through fallback formats below.
  }

  const unwrapped =
    (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw;

  try {
    return normalizePrivateKey(tryParseJson(unwrapped));
  } catch {
    // Continue through fallback formats below.
  }

  // Support credentials stored as base64-encoded JSON.
  if (!unwrapped.startsWith('{')) {
    try {
      const decoded = Buffer.from(unwrapped, 'base64').toString('utf8');
      return normalizePrivateKey(tryParseJson(decoded));
    } catch {
      // Continue through fallback formats below.
    }
  }

  // Recover from env values pasted as JS object literals using single quotes.
  const singleQuoteObject = unwrapped
    .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'(?=\s*[,}])/g, (_match, value) => {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `: "${escaped}"`;
    });

  try {
    return normalizePrivateKey(tryParseJson(singleQuoteObject));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
    throw new Error(
      `GOOGLE_KEY_JSON_DATA is not valid JSON. Paste the full service-account JSON object into Render, or provide it as a JSON string/base64 string. Parse error: ${message}`
    );
  }
};

const getGoogleAuth = async (forceRefresh = false) => {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

  // Return existing session if valid and not forcing a refresh
  if (cachedAuth && !forceRefresh) return cachedAuth;

  console.log('🔄 Initializing Neural Link Recovery Sequence...');
  if (forceRefresh) broadcastLog('WARN', '🔄 RECOVERY_PROTOCOL: RE-INITIALIZING_GOOGLE_AUTH');

  try {
    if (process.env.GOOGLE_KEY_JSON_DATA) {
      const credentials = parseGoogleCredentials(process.env.GOOGLE_KEY_JSON_DATA);
      cachedAuth = new google.auth.GoogleAuth({ credentials, scopes });
      console.log('✅ Google Auth initialized from GOOGLE_KEY_JSON_DATA env var');
    } else if (require('fs').existsSync(require('path').join(__dirname, '..', 'google-key.json'))) {
      cachedAuth = new google.auth.GoogleAuth({ keyFile: require('path').join(__dirname, '..', 'google-key.json'), scopes });
      console.log('✅ Google Auth initialized from google-key.json file');
    } else {
      throw new Error(
        'Google credentials missing. Set GOOGLE_KEY_JSON_DATA env var (production) or provide google-key.json (local dev).'
      );
    }

    // Test the client to ensure it's functional
    await cachedAuth.getClient();
    return cachedAuth;
  } catch (e) {
    cachedAuth = null;
    const msg = e instanceof Error ? e.message : 'Unknown Auth Error';
    broadcastLog('ERROR', `GOOGLE_AUTH_FAILED: ${msg}`);
    throw new Error(`Google Auth Failed: ${msg}`);
  }
};

  // 1.2 Lead Injection / Sheet Sync
  const SPREADSHEET_ID = '1e4ZanBSWWDYkp-ww79vVl3SQZt294Zfhi7dvAkWKaN4';
  const RANGE = 'MZANZI_ENGINE!A4:J';

  // In-memory call tracking: CallSid → metadata
  interface ActiveCall {
    phone: string;
    name: string;
    startTime: Date;
    aiConversation: string[];
    language?: string;
    mode?: string;
    demoConfig?: { fullName?: string; company: string; objective: string; persona?: string; language: string };
  }
  const activeCalls = new Map<string, ActiveCall>();

  // Support both GET and POST for easier debugging/testing
  // Shared row-parser for both GAS and Sheets API paths
  const parseSheetRows = (rows: any[][]): any[] => {
    const source = RANGE.split('!')[0];
    const leads: any[] = [];
    rows.forEach((row: any[]) => {
      const name = (row[1] || '').trim();
      const phone = (row[2] || '').trim();
      if (name && phone && name !== 'First_Name') {
        leads.push({
          id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          surname: '',
          phone,
          language: (row[3] || 'en-ZA') as Language,
          status: 'READY_FOR_EXECUTION',
          source,
          area: (row[4] || 'Imported').trim(),
          signup_date: new Date().toISOString(),
          collected_data: {}
        });
      }
    });
    return leads;
  };

  app.all(['/api/clients/sync-sheets', '/api/clients/sync-sheets/'], async (req, res) => {
    console.log(`📥 [${req.method}] Importing Signal: Syncing Sheets`);
    const GAS_URL = process.env.GAS_WEBHOOK_URL;
    let allLeads: any[] = [];
    let syncSource = '';

    // ── PRIMARY: Google Apps Script web app (no service-account auth needed) ──
    if (GAS_URL) {
      try {
        console.log('📡 GAS PRIMARY: fetching leads via Apps Script webhook...');
        const gasRes = await fetch(GAS_URL);
        if (!gasRes.ok) throw new Error(`GAS responded ${gasRes.status}`);
        const gasData = await gasRes.json() as any;
        // GAS can return { rows: [[...], ...] } or [[...], ...] directly
        const rows: any[][] = Array.isArray(gasData) ? gasData : (gasData.rows || gasData.values || []);
        allLeads = parseSheetRows(rows);
        syncSource = 'GAS_WEBHOOK';
        console.log(`✅ GAS PRIMARY: ${allLeads.length} leads fetched.`);
      } catch (gasErr: any) {
        console.warn(`⚠️ GAS PRIMARY failed (${gasErr.message}), falling back to Sheets API...`);
        broadcastLog('WARN', `GAS_PRIMARY_FAILED: ${gasErr.message} — trying Sheets API fallback`);
      }
    }

    // ── SECONDARY: Sheets API (service-account) ──
    if (allLeads.length === 0) {
      try {
        console.log('📡 SHEETS API SECONDARY: fetching leads via service account...');
        const auth = await getGoogleAuth();
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
        allLeads = parseSheetRows(response.data.values || []);
        syncSource = 'SHEETS_API';
        console.log(`✅ SHEETS API SECONDARY: ${allLeads.length} leads fetched.`);
      } catch (apiErr: any) {
        console.error('❌ SHEETS API SECONDARY also failed:', apiErr.message);
        // Both paths failed — return structured error with demo fallback
        const fallbackLead = {
          id: `L-${Date.now()}`,
          name: 'Thabo (Demo)',
          surname: 'Mokoena',
          phone: '+27820000001',
          language: 'zu-ZA' as Language,
          status: 'READY_FOR_EXECUTION' as const,
          source: 'FALLBACK',
          area: 'Demo Area',
          signup_date: new Date().toISOString(),
          collected_data: {}
        };
        clientService.importClients([fallbackLead]);
        return res.status(200).json({
          success: false,
          message: `Lead injection sequence failed. Reason: ${apiErr.message}`,
          leads: [fallbackLead],
          error: apiErr.message
        });
      }
    }

    // Empty sheet — inject demo sentinel
    if (allLeads.length === 0) {
      allLeads.push({
        id: `L-${Date.now()}`,
        name: 'Thabo',
        surname: 'Mokoena',
        phone: '+27820000001',
        language: 'zu-ZA' as Language,
        status: 'READY_FOR_EXECUTION',
        source: 'MZANZI_ENGINE',
        area: 'Gauteng',
        signup_date: new Date().toISOString(),
        collected_data: {}
      });
    }

    allLeads.forEach(lead => clientService.importClients([lead]));
    res.json({
      success: true,
      message: `Successfully synced ${allLeads.length} leads via ${syncSource}.`,
      leads: allLeads,
      syncSource
    });
  });

// 1.3 Active Lead List
app.get('/api/clients', (req, res) => {
  res.json(clientService.getClients());
});

// 2. TRIGGER CALL
app.all('/make-call', async (req, res) => {
  try {
    const clients = clientService.getClients();
    const clientId = req.body.clientId;
    const phone = req.body.phone;
    const name = req.body.name || 'Manual';
    const callableStatuses = new Set(['pending', 'READY_FOR_EXECUTION', 'LOADED']);
    const targetClient = clientId 
      ? clients.find(c => c.id === clientId)
      : clients.find(c => callableStatuses.has(c.status));

    // Allow ad-hoc calls when a phone number is provided directly
    const dialPhone = targetClient?.phone || phone;
    const dialName = targetClient?.name || name;

    if (!dialPhone) {
      return res.status(400).json({ success: false, error: "No phone number or matching client found to dial." });
    }

    console.log(`☎️ Dialing ${dialName} at ${dialPhone}...`);

    // PUBLIC_DOMAIN overrides DOMAIN for local ngrok testing
    const domain = process.env.PUBLIC_DOMAIN || process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

    // Build TwiML URL — pass mode + demoConfig as query params so the
    // /api/twilio/twiml callback can read them when Twilio requests instructions
    const callMode = req.body.mode || 'OPERATOR';
    const normalizedDemoConfig = req.body.demoConfig
      ? {
          ...req.body.demoConfig,
          company: req.body.demoConfig.companyName || req.body.demoConfig.company || '',
        }
      : undefined;
    const encodedConfig = encodeURIComponent(JSON.stringify(normalizedDemoConfig || {}));
    const twimlUrl = `https://${domain}/api/twilio/twiml?mode=${callMode}&config=${encodedConfig}`;

    const call = await getTwilioClient().calls.create({
      to: dialPhone,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      url: twimlUrl,
      record: true,
      timeout: 60,
    });

    // Track call metadata for Intelligence Ledger (include language for protocol routing)
    activeCalls.set(call.sid, {
      phone: dialPhone,
      name: dialName,
      startTime: new Date(),
      aiConversation: [],
      ...(targetClient?.language ? { language: targetClient.language } : {}),
      mode: req.body.mode || 'OPERATOR',
      demoConfig: normalizedDemoConfig || undefined,
    } as ActiveCall);

    res.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error("Twilio Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2b. TWILIO TWIML CALLBACK — Twilio calls this URL to get call instructions
// When Twilio dials the phone, it hits this route to ask "What do I do now?".
// We tell it to open a WebSocket (<Stream>) and inject demo parameters directly into the audio stream.
app.post('/api/twilio/twiml', (req, res) => {
  const mode = (req.query.mode as string) || 'OPERATOR';
  const configString = req.query.config as string;

  let demoConfig: any = {};
  if (configString) {
    try { demoConfig = JSON.parse(decodeURIComponent(configString)); } catch { /* ignore */ }
  }

  const domain = process.env.PUBLIC_DOMAIN || process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

  console.log(`📡 TwiML callback — mode:${mode}, company:${demoConfig.companyName || demoConfig.company || '—'}`);

  const twiml = `
    <Response>
      <Connect>
        <Stream url="wss://${domain}/api/twilio/stream">
          <Parameter name="appMode" value="${mode}" />
        <Parameter name="fullName" value="${demoConfig.fullName || ''}" />
        <Parameter name="company" value="${demoConfig.companyName || demoConfig.company || ''}" />
        <Parameter name="objective" value="${demoConfig.objective || ''}" />
        <Parameter name="persona" value="${demoConfig.persona || ''}" />
        <Parameter name="language" value="${demoConfig.language || ''}" />
        </Stream>
      </Connect>
    </Response>
  `;

  res.type('text/xml');
  res.send(twiml);
});

// ─── OS³ Neural Prompt Injector ─── Demo-Aware System Prompt Generator ───
function normalizeDemoLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    'Auto-Detect': 'auto',
    'English': 'en-ZA',
    'Zulu': 'zu-ZA',
    'Afrikaans': 'af-ZA',
    'Sepedi': 'nso-ZA',
    'Greek': 'el-GR',
    'Portuguese': 'pt-PT',
    'Mandarin': 'zh-CN'
  };
  return languageMap[language] || language;
}

function generateDemoPrompt(demoConfig: { fullName?: string; company: string; objective: string; persona?: string; language: string }, _language?: string): string {
  let objectiveText = '';
  if (demoConfig.objective === 'Receptionist & Routing') {
    objectiveText = 'acting as a front-desk receptionist. Greet the caller warmly, ask how you can direct their call, and take detailed messages if the person they want is unavailable.';
  } else if (demoConfig.objective === 'Outbound Lead Qualification') {
    objectiveText = 'acting as an outbound sales development representative. Your goal is to qualify the lead, ask about their current pain points, and gently push to schedule a follow-up meeting with an account executive.';
  } else if (demoConfig.objective === 'Cold Calling') {
    objectiveText = 'acting as a cold-calling agent. Open with confidence, establish relevance quickly, overcome resistance calmly, and work toward permission for a deeper conversation or follow-up.';
  } else if (demoConfig.objective === 'Technical Support Troubleshooting') {
    objectiveText = 'acting as a tier-1 technical support agent. Listen to their issue patiently, apologize for any inconvenience, and guide them through basic troubleshooting or escalate the ticket.';
  }

  const personaText = demoConfig.persona === 'Strict & Ultra-Professional'
    ? 'Your tone is strict, ultra-professional, concise, and highly controlled.'
    : 'Your tone is extremely friendly, conversational, warm, and highly engaging.';

  const normalizedLanguage = normalizeDemoLanguage(demoConfig.language);

  return `You are Zandi, an extremely friendly, conversational, and highly professional AI voice agent representing ${demoConfig.company || 'our company'}.

Your primary objective is to be ${objectiveText}

CRITICAL RULES:
1. ${personaText}
2. Keep your responses concise (1-2 sentences max) so the conversation flows rapidly.
3. Never break character. You work for ${demoConfig.company || 'this company'}.
4. ${demoConfig.fullName ? `You are operating this demo for ${demoConfig.fullName}.` : 'You are operating this demo for the current user.'}
5. Language Matrix: ${normalizedLanguage === 'auto' ? 'Listen to the user and automatically seamlessly switch to whatever language they are speaking.' : `Strictly speak in ${demoConfig.language}.`}`;
}

// ─── ZANDI RUN PROTOCOL ─── Language-Aware Greeting & System Prompt ───
const LANGUAGE_PROTOCOLS: Record<string, { greeting: string; speechLang: string; personality: string; languageName: string }> = {
  'zu-ZA': {
    greeting: 'Sawubona! Ngu-Zandi lapha, ngisuka e-Mzansi Solutions. Ngingakhuluma nomninikhaya?',
    speechLang: 'zu-ZA',
    personality: 'Warm, respectful, community-focused tone rooted in Ubuntu spirit.',
    languageName: 'isiZulu'
  },
  'af-ZA': {
    greeting: 'Goeiedag! Dit is Zandi van Mzansi Solutions. Praat ek met die huiseienaar?',
    speechLang: 'af-ZA',
    personality: 'Direct, efficient, and professional execution.',
    languageName: 'Afrikaans'
  },
  'en-ZA': {
    greeting: 'Hello! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?',
    speechLang: 'en-ZA',
    personality: 'Executive, tactical, and high-speed clarity.',
    languageName: 'English'
  },
  'xh-ZA': {
    greeting: 'Molo! NdinguZandi wakwa-Mzansi Solutions. Ndingakhe ndithethe nomnini-ndlu?',
    speechLang: 'xh-ZA',
    personality: 'Respectful, deliberate, with Eastern Cape clarity and Ubuntu warmth.',
    languageName: 'isiXhosa'
  },
  'nso-ZA': {
    greeting: 'Dumela! Ke Zandi go tšwa go Mzansi Solutions. Na ke bolela le mong wa ntlo?',
    speechLang: 'nso-ZA',
    personality: 'Warm, measured, and community-oriented in Sepedi tradition.',
    languageName: 'Sepedi'
  },
  'pt-PT': {
    greeting: 'Olá! Aqui é a Zandi da Mzansi Solutions. Estou a falar com o proprietário da casa?',
    speechLang: 'pt-PT',
    personality: 'Professional, warm, and articulate in Portuguese.',
    languageName: 'Portuguese'
  },
  'el-GR': {
    greeting: 'Γεια σας! Είμαι η Zandi από τη Mzansi Solutions. Μιλώ με τον ιδιοκτήτη του σπιτιού;',
    speechLang: 'el-GR',
    personality: 'Authoritative, precise, and courteous in Greek.',
    languageName: 'Greek'
  },
  'zh-CN': {
    greeting: '您好！我是Mzansi Solutions的Zandi。请问我是在和房屋业主通话吗？',
    speechLang: 'zh-CN',
    personality: 'Efficient, technically precise, and respectful in Mandarin.',
    languageName: 'Mandarin Chinese'
  }
};

const BASE_SYSTEM_PROMPT = `You are Zandi, an elite qualification specialist for Mzansi Solutions.

=== GLOBAL GUARDRAILS ===
- NEVER share or repeat internal PII such as full ID numbers, addresses, or account details.
- If the caller is abusive or hostile, politely end the call: "Thank you for your time. Goodbye."
- Keep every response under three concise sentences.

=== COMPLIANCE (POPIA) ===
- At the START of the call, state: "Please note this call is recorded for quality and training purposes."
- Before ending a qualified call, explicitly ask: "May we contact you in the future regarding solar solutions and related offers? A simple yes or no is fine."
- Record the POPIA consent answer.

=== CALL OBJECTIVES ===
1. Verify identity — confirm you are speaking with the homeowner.
2. Confirm residential area — Gauteng or Western Cape (required for regional grid compatibility).
3. Gauge interest in the Mzansi Solutions hybrid solar system.

=== PRODUCT KNOWLEDGE ===
- Product: 5kW Hybrid Inverter system.
- Cost: R0 upfront for qualified homeowners.
- Value: Eskom-Independence and Load-Shedding Security.
- Frame the offer around freedom from load-shedding and energy cost savings.

=== CALL FLOW ===
Step 1 — Greeting & compliance notice (call recording disclosure).
Step 2 — Identity verification: "Am I speaking with the homeowner?"
Step 3 — Area confirmation: "May I confirm your residential area?"
Step 4 — Interest gauge: Present the 5kW hybrid system value proposition.
Step 5 — POPIA consent capture.
Step 6 — Closing: Thank the caller and summarise the outcome.

=== OUTPUT CONTRACT ===
When the call is complete (qualified or failed), your FINAL message must end with a JSON block on its own line:
{"status":"QUALIFIED"|"FAILED","reasoning":"Brief outcome summary","interest_level":"HIGH"|"MEDIUM"|"LOW","popia_consent":"YES"|"NO"}
`;

function buildSystemPrompt(language: string, callMeta?: ActiveCall): string {
  // DEMO mode: use the dynamic demo prompt instead of BASE_SYSTEM_PROMPT
  if (callMeta?.mode === 'DEMO' && callMeta.demoConfig) {
    const demoBase = generateDemoPrompt(callMeta.demoConfig);
    const protocol = LANGUAGE_PROTOCOLS[language] || LANGUAGE_PROTOCOLS['en-ZA'];
    return `${demoBase}\n=== LANGUAGE NODE: ${language} ===\nPersonality: ${protocol.personality}\nGreet the caller in this language style.`;
  }

  // OPERATOR mode: full Mzansi Solutions qualification prompt
  const protocol = LANGUAGE_PROTOCOLS[language] || LANGUAGE_PROTOCOLS['en-ZA'];
  const langDirective = protocol.languageName !== 'English'
    ? `\n=== MANDATORY LANGUAGE DIRECTIVE ===\nYou MUST respond ENTIRELY in ${protocol.languageName}. Every word of every response must be in ${protocol.languageName}. Do NOT switch to English under any circumstances, even if the caller speaks English. The ONLY exception is the final JSON output contract block which remains in English keys.`
    : '';
  return `${BASE_SYSTEM_PROMPT}\n=== LANGUAGE NODE: ${language} ===\nPersonality: ${protocol.personality}${langDirective}\nGreet the caller in this language style.`;
}

// 3. VOICE HANDLER
app.all('/voice-handler', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const callSid = req.body?.CallSid as string | undefined;
  const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

  // Resolve language from tracked call metadata or default to en-ZA
  const callMeta = callSid ? activeCalls.get(callSid) : undefined;
  const lang = (callMeta as any)?.language || 'en-ZA';
  const protocol = LANGUAGE_PROTOCOLS[lang] || LANGUAGE_PROTOCOLS['en-ZA'];
  const welcomeText = `${protocol.greeting} Please note this call is recorded for quality and training purposes.`;

  try {
    const gather = twiml.gather({
      input: ['speech'],
      action: '/handle-response',
      language: protocol.speechLang as any,
      speechTimeout: 'auto'
    });

    gather.play(`https://${domain}/audio-stream?text=${encodeURIComponent(welcomeText)}&lang=${encodeURIComponent(lang)}`);
    twiml.redirect('/voice-handler');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// 4. BRAIN LOGIC — Azure OpenAI
app.all('/handle-response', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const userSpeech = req.body.SpeechResult; 
  const callSid = req.body.CallSid as string | undefined;
  const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

  if (!userSpeech) {
    twiml.redirect('/voice-handler');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  // Resolve language for this call
  const callLang = callSid && activeCalls.has(callSid) ? (activeCalls.get(callSid) as any).language || 'en-ZA' : 'en-ZA';
  const callMetaForPrompt = callSid ? activeCalls.get(callSid) : undefined;
  const systemPrompt = buildSystemPrompt(callLang, callMetaForPrompt);

  // AI logic — Azure OpenAI with full RUN PROTOCOL
  const aiResponse = await aiService.generateResponse(userSpeech, systemPrompt);

  // Track conversation for Intelligence Ledger
  if (callSid && activeCalls.has(callSid)) {
    activeCalls.get(callSid)!.aiConversation.push(`User: ${userSpeech}`, `AI: ${aiResponse}`);
  }

  // Extract JSON output contract if present in AI response
  let outputContract: { status?: string; reasoning?: string; interest_level?: string; popia_consent?: string } | null = null;
  const jsonMatch = aiResponse.match(/\{[\s\S]*"status"\s*:\s*"(QUALIFIED|FAILED)"[\s\S]*\}/);
  if (jsonMatch) {
    try { outputContract = JSON.parse(jsonMatch[0]); } catch { /* parsing failed — use keyword fallback */ }
  }

  // Detect call completion via output contract or keyword fallback
  const completionKeywords = ['verified', 'qualified', 'thank you for your time', 'goodbye', 'have a great day', 'call complete'];
  const isCallComplete = !!outputContract || completionKeywords.some(kw => aiResponse.toLowerCase().includes(kw));

  if (isCallComplete && callSid) {
    const callMeta = activeCalls.get(callSid);
    const status = outputContract?.status || (aiResponse.toLowerCase().includes('qualified') ? 'QUALIFIED' : 'COMPLETED');
    const ledgerOutput = outputContract
      ? `${outputContract.reasoning || ''} | Interest: ${outputContract.interest_level || 'N/A'} | POPIA: ${outputContract.popia_consent || 'N/A'}`
      : callMeta?.aiConversation.join(' | ') || aiResponse;

    // Log to Intelligence Ledger asynchronously (don't block TwiML response)
    logCallToIntelligenceLedger(
      callMeta?.phone || '',
      status,
      ledgerOutput,
      callSid
    ).catch(err => {
      console.error('❌ Intelligence Ledger write failed:', err.message);
    });

    // Strip JSON contract from spoken response
    const spokenResponse = aiResponse.replace(/\{[\s\S]*"status"\s*:[\s\S]*\}/, '').trim();
    twiml.play(`https://${domain}/audio-stream?text=${encodeURIComponent(spokenResponse)}&lang=${encodeURIComponent(callLang)}`);
    twiml.hangup();
  } else {
    const callLangForGather = callSid && activeCalls.has(callSid) ? (activeCalls.get(callSid) as any).language || 'en-ZA' : 'en-ZA';
    const gatherProtocol = LANGUAGE_PROTOCOLS[callLangForGather] || LANGUAGE_PROTOCOLS['en-ZA'];
    const gather = twiml.gather({
      input: ['speech'],
      action: '/handle-response',
      language: gatherProtocol.speechLang as any
    });

    // Audio still streams through voiceService (Azure TTS)
    gather.play(`https://${domain}/audio-stream?text=${encodeURIComponent(aiResponse)}&lang=${encodeURIComponent(callLangForGather)}`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * INTELLIGENCE LEDGER: FINAL SYNCHRONIZATION UNIT
 * Connects Azure AI results to the Google Sheet Hub.
 */
async function logCallToIntelligenceLedger(phone: string, status: string, aiOutput: string, callSid: string, attempt = 1) {
  const MAX_RETRIES = 3;

  try {
    const auth = await getGoogleAuth(attempt > 1); // Force refresh if this is a retry
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });
    const spreadsheetId = process.env.SPREADSHEET_ID || SPREADSHEET_ID;

    // 1. Locate Active Signal Row
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MZANZI_ENGINE!A:C',
    });

    const rows = sheetData.data.values || [];
    const rowIndex = rows.findIndex(row => row[2] === phone) + 1;

    if (rowIndex <= 0) throw new Error(`Signal ${phone} not found in Engine`);

    broadcastLog('INFO', `📡 LEDGER_SYNC_INITIATED: Row ${rowIndex} [${status}]`);

    // 2. Capture Live Telemetry from Twilio
    let duration = '0';
    try {
      const call = await getTwilioClient().calls(callSid).fetch();
      duration = call.duration || '0';
    } catch (err: any) {
      console.warn('⚠️ Could not fetch Twilio call duration:', err.message);
      const callData = activeCalls.get(callSid);
      if (callData) {
        duration = String(Math.round((Date.now() - callData.startTime.getTime()) / 1000));
      }
    }

    const now = new Date();

    // 3. Execute Write to Columns F through J
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MZANZI_ENGINE!F${rowIndex}:J${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          status,                   // Column F: Current_Status
          aiOutput,                 // Column G: AI_Output
          now.toLocaleDateString(), // Column H: Call_Date
          now.toLocaleTimeString(), // Column I: Call_Time
          duration                  // Column J: Duration_Sec
        ]]
      }
    });

    console.log(`✅ Sync Success on Attempt ${attempt} — Row ${rowIndex} [${status}] (duration: ${duration}s)`);
    broadcastLog('INFO', `✅ LEDGER_SYNC_COMPLETE: Row ${rowIndex} [${status}] (${duration}s)`);
    activeCalls.delete(callSid);

  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff (2s, 4s...)
      console.warn(`⚠️ Sync Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      broadcastLog('WARN', `⚠️ SYNC_RETRY: Attempt ${attempt} failed, retrying in ${delay}ms...`);
      setTimeout(() => logCallToIntelligenceLedger(phone, status, aiOutput, callSid, attempt + 1), delay);
    } else {
      // Final failure — triggers Azure Alert via KQL query
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`❌ Intelligence Ledger Connection Error: Permanent Failure after ${MAX_RETRIES} attempts. ${errorMessage}`);
      broadcastLog('ERROR', `❌ LEDGER_PERMANENT_FAILURE: ${errorMessage}`);

      if (telemetryClient) {
        telemetryClient.trackException({
          exception: new Error(`Intelligence Ledger Connection Error: Permanent Failure after ${MAX_RETRIES} attempts`),
          properties: { phone, status, callSid }
        });
      }

      activeCalls.delete(callSid);
    }
  }
}

// 5. AUDIO STREAMER
app.get('/audio-stream', async (req, res) => {
  const text = req.query.text as string;
  const language = req.query.lang as string | undefined;
  if (!text) return res.sendStatus(400);

  try {
    const audioBuffer = await voiceService.generateAudio(text, { language });
    res.set({
      'Content-Type': 'audio/basic',
      'Content-Length': audioBuffer.length
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("Audio Fail:", err);
    res.sendStatus(500);
  }
});

// helper to wrap mu-law buffer into WAV file (16-bit PCM) for browser playback
function mulawTo16Bit(sample: number) {
  // inverse mu-law companding
  const MULAW_MAX = 0xFF;
  sample = ~sample;
  const sign = sample & 0x80;
  let exponent = (sample & 0x70) >> 4;
  let mantissa = sample & 0x0F;
  let magnitude = ((mantissa << 4) + 0x08) << exponent;
  magnitude = sign ? -(magnitude) : magnitude;
  return magnitude;
}

function muLawToWav(muLawBuf: Uint8Array, sampleRate: number = 8000): Buffer {
  const numSamples = muLawBuf.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = bytesPerSample * 1;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;
  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // subchunk1 size
  buffer.writeUInt16LE(1, offset); offset += 2;  // PCM
  buffer.writeUInt16LE(1, offset); offset += 2;  // num channels
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample
  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  // write samples
  for (let i = 0; i < numSamples; i++) {
    const pcm = mulawTo16Bit(muLawBuf[i]);
    buffer.writeInt16LE(pcm, offset);
    offset += 2;
  }
  return buffer;
}

// 6. VOICE TESTER (Neural Lab)
app.post('/api/test-voice', async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    console.log(`🧪 Testing Voice: ${text}`);
    const audioBuffer = await voiceService.generateAudio(text, { allowFallback: false, format: 'wav', language });
    res.json({ success: true, audioBase64: Buffer.from(audioBuffer).toString('base64') });
  } catch (err: any) {
    console.error("Voice Test Fail:", err);
    // include the error message if available for better diagnostics
    res.status(500).json({ error: "Failed to generate test audio", details: err?.message || err });
  }
});

// 7. LOGIC TESTER (Neural Lab)
app.post('/api/test-logic', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    console.log(`🧠 Testing Logic: ${text}`);
    const aiResponse = await aiService.generateResponse(text);
    res.json({ success: true, response: aiResponse });
  } catch (err) {
    console.error("Logic Test Fail:", err);
    res.status(500).json({ error: "Failed to generate logic response" });
  }
});

// 8. INTERNAL NEURAL LINK — Browser-based conversational loop
// Accepts { text, language, history, mode, demoConfig }, runs full Zandi protocol (buildSystemPrompt),
// returns { success, text: spokenText, audioBase64 } for browser Audio playback.
app.post('/api/converse', async (req, res) => {
  const { text, language, history, mode, demoConfig } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const lang = (language as string) || 'en-ZA';
    console.log(`🔗 Internal Neural Link [${lang}] Mode: ${mode} | User: ${text}`);

    let systemPrompt = '';
    if (mode === 'DEMO' && demoConfig) {
      systemPrompt = generateDemoPrompt(demoConfig, lang);
    } else {
      systemPrompt = buildSystemPrompt(lang);
    }

    if (history) {
      systemPrompt += `\n\n=== RECENT CONVERSATION HISTORY ===\n${history}\n\nCRITICAL INSTRUCTION: Read the history above. DO NOT repeat the greeting or steps you have already completed. Move strictly to the NEXT logical step in the CALL FLOW based on the user's last message.`;
    }

    const aiResponse = await aiService.generateResponse(text, systemPrompt);

    // Strip JSON output contract block to get natural-language spoken text
    let spokenText = aiResponse.replace(/\{[\s\S]*?"status"\s*:\s*"(QUALIFIED|FAILED)"[\s\S]*?\}/g, '').trim();
    if (!spokenText) {
      try {
        const parsed = JSON.parse(aiResponse);
        spokenText = parsed.reasoning || aiResponse;
      } catch { spokenText = aiResponse; }
    }

    const audioBuffer = await voiceService.generateAudio(spokenText, { allowFallback: true, format: 'wav', language: lang });
    res.json({ success: true, text: spokenText, audioBase64: Buffer.from(audioBuffer).toString('base64') });
  } catch (err: any) {
    console.error('❌ Internal Neural Link Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Converse failed' });
  }
});

async function startServer() {
  // Global Error Handler for API routes
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('🔥 API Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    // Dynamic import of Vite — only in dev mode, keeps production bundle lean
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = resolveFrontendDistDir();
    if (!distDir) {
      throw new Error('Unable to locate frontend dist directory. Expected dist/index.html.');
    }

    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[MZANZI ENGINE] Live and listening on port ${PORT}`);
  });

  // ── Node 08: Pre-Flight Warm-Up ─────────────────────────────────────────
  // Keeps the SA North (Johannesburg) Azure Speech node and Google Sheets
  // connection alive every 4 minutes so the first real call doesn't hit a
  // cold-start penalty. Uses a single-space synthesis (1 billable character)
  // to refresh the Speech SDK connection without audible output.
  const WARMUP_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

  async function warmUpConnections() {
    // 1. Azure Speech silent ping — synthesizes a single space to tickle the
    //    SA North TTS node without generating usable audio or spending quota.
    if (process.env.SPEECH_KEY && process.env.SPEECH_REGION) {
      try {
        await voiceService.generateAudio(' ', { allowFallback: false });
        broadcastLog('SYSTEM', '[SYS] UPLINK_WARM_HEARTBEAT_SUCCESS');
      } catch {
        broadcastLog('WARN', '[SYS] UPLINK_WARM_HEARTBEAT_SKIPPED');
      }
    }

    // 2. Google Sheets poke — re-validates the auth token and refreshes the
    //    cached credential so the Intelligence Ledger never stalls mid-call.
    try {
      const auth = await getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });
      const spreadsheetId = process.env.SPREADSHEET_ID || '1e4ZanBSWWDYkp-ww79vVl3SQZt294Zfhi7dvAkWKaN4';
      await sheets.spreadsheets.get({ spreadsheetId, fields: 'spreadsheetId' });
      broadcastLog('SYSTEM', '[SYS] LEDGER_WARM_HEARTBEAT_SUCCESS');
    } catch {
      broadcastLog('WARN', '[SYS] LEDGER_WARM_HEARTBEAT_SKIPPED');
    }
  }

  // Run once immediately on startup, then on schedule
  warmUpConnections().catch(() => {});
  setInterval(() => warmUpConnections().catch(() => {}), WARMUP_INTERVAL_MS);
}

startServer().catch((err) => {
  console.error('💥 Fatal server startup error:', err);
  process.exit(1);
});
