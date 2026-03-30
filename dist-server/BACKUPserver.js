"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({ override: true });
// --- STARTUP DIAGNOSTICS (helps debug Azure App Service issues) ---
console.log(`[STARTUP] Node ${process.version} | ENV=${process.env.NODE_ENV} | PORT=${process.env.PORT} | CWD=${process.cwd()}`);
console.log(`[STARTUP] TWILIO_SID=${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING'} | AZURE_KEY=${process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING'} | SPEECH=${process.env.SPEECH_KEY ? 'SET' : 'MISSING'}`);
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const twilio_1 = __importDefault(require("twilio"));
const cors_1 = __importDefault(require("cors")); // Added CORS for frontend-backend communication
const voiceService_1 = require("./services/voiceService");
const azureOpenAiService_1 = require("./services/azureOpenAiService");
const clientService_1 = require("./services/clientService");
const googleapis_1 = require("googleapis");
// Fix: Import Buffer explicitly for Node.js environments where it might not be globally available in the TypeScript context
const buffer_1 = require("buffer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const appInsights = __importStar(require("applicationinsights"));
const ws_1 = require("ws");
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
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = Number(process.env.PORT) || 3000;
// Initialize WebSocket Server for live terminal uplink
const wss = new ws_1.WebSocketServer({ server });
let wsClients = [];
wss.on('connection', (ws) => {
    wsClients.push(ws);
    ws.send(JSON.stringify({ type: 'SYSTEM', message: '🛰️ LIVE_TERMINAL_UPLINK_ESTABLISHED' }));
    broadcastLog('INFO', `📡 ACTIVE_CONNECTIONS: ${wsClients.length}`);
    ws.on('close', () => {
        wsClients = wsClients.filter(c => c !== ws);
    });
});
/**
 * Broadcasts logs to the React Frontend via WebSocket
 */
function broadcastLog(type, message) {
    const payload = JSON.stringify({ type, message, timestamp: new Date().toLocaleTimeString() });
    wsClients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN)
            client.send(payload);
    });
}
function resolveFrontendDistDir() {
    const candidates = [
        path_1.default.join(process.cwd(), 'dist'),
        path_1.default.join(__dirname, 'dist'),
        path_1.default.join(__dirname, '..', 'dist')
    ];
    return candidates.find((dir) => fs_1.default.existsSync(path_1.default.join(dir, 'index.html')));
}
// Enable CORS for all origins
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request Logger - CRITICAL for debugging
app.use((req, res, next) => {
    console.log(`📡 [${req.method}] ${req.url}`);
    next();
});
// Lazy Twilio client — only initialised when actually needed (not at startup)
let _twilioClient = null;
function getTwilioClient() {
    if (!_twilioClient) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token)
            throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured');
        _twilioClient = (0, twilio_1.default)(sid, token);
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
let cachedAuth = null;
const getGoogleAuth = async (forceRefresh = false) => {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    // Return existing session if valid and not forcing a refresh
    if (cachedAuth && !forceRefresh)
        return cachedAuth;
    console.log('🔄 Initializing Neural Link Recovery Sequence...');
    if (forceRefresh)
        broadcastLog('WARN', '🔄 RECOVERY_PROTOCOL: RE-INITIALIZING_GOOGLE_AUTH');
    try {
        if (process.env.GOOGLE_KEY_JSON_DATA) {
            const credentials = JSON.parse(process.env.GOOGLE_KEY_JSON_DATA);
            cachedAuth = new googleapis_1.google.auth.GoogleAuth({ credentials, scopes });
            console.log('✅ Google Auth initialized from GOOGLE_KEY_JSON_DATA env var');
        }
        else if (require('fs').existsSync('./google-key.json')) {
            cachedAuth = new googleapis_1.google.auth.GoogleAuth({ keyFile: './google-key.json', scopes });
            console.log('✅ Google Auth initialized from google-key.json file');
        }
        else {
            throw new Error('Google credentials missing. Set GOOGLE_KEY_JSON_DATA env var (production) or provide google-key.json (local dev).');
        }
        // Test the client to ensure it's functional
        await cachedAuth.getClient();
        return cachedAuth;
    }
    catch (e) {
        cachedAuth = null;
        const msg = e instanceof Error ? e.message : 'Unknown Auth Error';
        broadcastLog('ERROR', `GOOGLE_AUTH_FAILED: ${msg}`);
        throw new Error(`Google Auth Failed: ${msg}`);
    }
};
// 1.2 Lead Injection / Sheet Sync
const SPREADSHEET_ID = '1e4ZanBSWWDYkp-ww79vVl3SQZt294Zfhi7dvAkWKaN4';
const RANGE = 'MZANZI_ENGINE!A4:J';
const activeCalls = new Map();
// Support both GET and POST for easier debugging/testing
app.all(['/api/clients/sync-sheets', '/api/clients/sync-sheets/'], async (req, res) => {
    console.log(`📥 [${req.method}] Importing Signal: Syncing Sheets (Source: 12bR...dO5g)`);
    try {
        const auth = await getGoogleAuth();
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth: await auth.getClient() });
        console.log(`📡 Fetching data from Google Sheets range: ${RANGE}...`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });
        const rows = response.data.values || [];
        const allLeads = [];
        const source = RANGE.split('!')[0];
        rows.forEach((row) => {
            // Name (col B / index 1) and Phone (col C / index 2) are required; skip header echoes
            const name = (row[1] || '').trim();
            const phone = (row[2] || '').trim();
            if (name && phone && name !== 'First_Name') {
                allLeads.push({
                    id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    surname: '',
                    phone,
                    language: (row[3] || 'en-ZA'),
                    status: 'READY_FOR_EXECUTION',
                    source: source,
                    area: (row[4] || 'Imported').trim(),
                    signup_date: new Date().toISOString(),
                    collected_data: {}
                });
            }
        });
        console.log(`✅ Processed ${allLeads.length} leads from sheets.`);
        // If no leads found (e.g. API failed or empty), provide a fallback for demo
        if (allLeads.length === 0) {
            console.log('⚠️ No leads found in sheets, using fallback lead.');
            allLeads.push({
                id: `L-${Date.now()}`,
                name: 'Thabo',
                surname: 'Mokoena',
                phone: '+27820000001',
                language: 'zu-ZA',
                status: 'READY_FOR_EXECUTION',
                source: 'MZANZI_ENGINE',
                area: 'Gauteng',
                signup_date: new Date().toISOString(),
                collected_data: {}
            });
        }
        // Add leads to client service
        allLeads.forEach(lead => clientService_1.clientService.importClients([lead]));
        res.json({
            success: true,
            message: `Successfully synced ${allLeads.length} leads from ${RANGE}.`,
            leads: allLeads
        });
    }
    catch (error) {
        console.error('❌ Sheet Sync Error:', error.message);
        // log the raw rows if available for debugging
        if (error.response?.data?.values) {
            console.warn('🚨 Raw sheet rows that caused failure:', error.response.data.values);
        }
        // Fallback lead for demo purposes if API fails or auth fails
        const fallbackLead = {
            id: `L-${Date.now()}`,
            name: 'Thabo (Demo)',
            surname: 'Mokoena',
            phone: '+27820000001',
            language: 'zu-ZA',
            status: 'READY_FOR_EXECUTION',
            source: 'FALLBACK',
            area: 'Demo Area',
            signup_date: new Date().toISOString(),
            collected_data: {}
        };
        try {
            clientService_1.clientService.importClients([fallbackLead]);
        }
        catch (e) {
            console.error('⚠️ Could not import fallback lead:', e);
        }
        const isApiDisabled = error.message.includes('googleapis.com') || error.message.includes('disabled');
        // Use 200 status even on error to prevent platform's HTML 403/500 overrides
        res.status(200).json({
            success: false,
            message: isApiDisabled
                ? `Google Sheets API is disabled. Please enable it in the Google Cloud Console: ${error.message}`
                : `Lead injection sequence failed. Reason: ${error.message === 'AUTH_FAILED' ? 'Google Auth Unavailable' : error.message}`,
            leads: [fallbackLead],
            error: error.message,
            isApiDisabled
        });
    }
});
// 1.3 Active Lead List
app.get('/api/clients', (req, res) => {
    res.json(clientService_1.clientService.getClients());
});
// 2. TRIGGER CALL
app.all('/make-call', async (req, res) => {
    try {
        const clients = clientService_1.clientService.getClients();
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
        // Ensure DOMAIN is set or fallback to APP_URL for the environment
        const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);
        const call = await getTwilioClient().calls.create({
            to: dialPhone,
            from: process.env.TWILIO_PHONE_NUMBER || '',
            url: `https://${domain}/voice-handler`,
            timeout: 60
        });
        // Track call metadata for Intelligence Ledger (include language for protocol routing)
        activeCalls.set(call.sid, {
            phone: dialPhone,
            name: dialName,
            startTime: new Date(),
            aiConversation: [],
            ...(targetClient?.language ? { language: targetClient.language } : {})
        });
        res.json({ success: true, callSid: call.sid });
    }
    catch (error) {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ─── ZANDI RUN PROTOCOL ─── Language-Aware Greeting & System Prompt ───
const LANGUAGE_PROTOCOLS = {
    'zu-ZA': {
        greeting: 'Sawubona! Ngu-Zandi lapha, ngisuka e-Mzansi Solutions. Ngingakhuluma nomninikhaya?',
        speechLang: 'zu-ZA',
        personality: 'Warm, respectful, community-focused tone rooted in Ubuntu spirit.'
    },
    'af-ZA': {
        greeting: 'Goeiedag! Dit is Zandi van Mzansi Solutions. Praat ek met die huiseienaar?',
        speechLang: 'af-ZA',
        personality: 'Direct, efficient, and professional execution.'
    },
    'en-ZA': {
        greeting: 'Hello! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?',
        speechLang: 'en-ZA',
        personality: 'Executive, tactical, and high-speed clarity.'
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
function buildSystemPrompt(language) {
    const protocol = LANGUAGE_PROTOCOLS[language] || LANGUAGE_PROTOCOLS['en-ZA'];
    return `${BASE_SYSTEM_PROMPT}\n=== LANGUAGE NODE: ${language} ===\nPersonality: ${protocol.personality}\nGreet the caller in this language style.`;
}
// 3. VOICE HANDLER
app.all('/voice-handler', async (req, res) => {
    const twiml = new twilio_1.default.twiml.VoiceResponse();
    const callSid = req.body?.CallSid;
    const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);
    // Resolve language from tracked call metadata or default to en-ZA
    const callMeta = callSid ? activeCalls.get(callSid) : undefined;
    const lang = callMeta?.language || 'en-ZA';
    const protocol = LANGUAGE_PROTOCOLS[lang] || LANGUAGE_PROTOCOLS['en-ZA'];
    const welcomeText = `${protocol.greeting} Please note this call is recorded for quality and training purposes.`;
    try {
        const gather = twiml.gather({
            input: ['speech'],
            action: '/handle-response',
            language: protocol.speechLang,
            speechTimeout: 'auto'
        });
        gather.play(`https://${domain}/audio-stream?text=${encodeURIComponent(welcomeText)}&lang=${encodeURIComponent(lang)}`);
        twiml.redirect('/voice-handler');
        res.type('text/xml');
        res.send(twiml.toString());
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});
// 4. BRAIN LOGIC — Azure OpenAI
app.all('/handle-response', async (req, res) => {
    const twiml = new twilio_1.default.twiml.VoiceResponse();
    const userSpeech = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);
    if (!userSpeech) {
        twiml.redirect('/voice-handler');
        res.type('text/xml');
        res.send(twiml.toString());
        return;
    }
    // Resolve language for this call
    const callLang = callSid && activeCalls.has(callSid) ? activeCalls.get(callSid).language || 'en-ZA' : 'en-ZA';
    const systemPrompt = buildSystemPrompt(callLang);
    // AI logic — Azure OpenAI with full RUN PROTOCOL
    const aiResponse = await azureOpenAiService_1.aiService.generateResponse(userSpeech, systemPrompt);
    // Track conversation for Intelligence Ledger
    if (callSid && activeCalls.has(callSid)) {
        activeCalls.get(callSid).aiConversation.push(`User: ${userSpeech}`, `AI: ${aiResponse}`);
    }
    // Extract JSON output contract if present in AI response
    let outputContract = null;
    const jsonMatch = aiResponse.match(/\{[\s\S]*"status"\s*:\s*"(QUALIFIED|FAILED)"[\s\S]*\}/);
    if (jsonMatch) {
        try {
            outputContract = JSON.parse(jsonMatch[0]);
        }
        catch { /* parsing failed — use keyword fallback */ }
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
        logCallToIntelligenceLedger(callMeta?.phone || '', status, ledgerOutput, callSid).catch(err => {
            console.error('❌ Intelligence Ledger write failed:', err.message);
        });
        // Strip JSON contract from spoken response
        const spokenResponse = aiResponse.replace(/\{[\s\S]*"status"\s*:[\s\S]*\}/, '').trim();
        twiml.play(`https://${domain}/audio-stream?text=${encodeURIComponent(spokenResponse)}&lang=${encodeURIComponent(callLang)}`);
        twiml.hangup();
    }
    else {
        const callLangForGather = callSid && activeCalls.has(callSid) ? activeCalls.get(callSid).language || 'en-ZA' : 'en-ZA';
        const gatherProtocol = LANGUAGE_PROTOCOLS[callLangForGather] || LANGUAGE_PROTOCOLS['en-ZA'];
        const gather = twiml.gather({
            input: ['speech'],
            action: '/handle-response',
            language: gatherProtocol.speechLang
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
async function logCallToIntelligenceLedger(phone, status, aiOutput, callSid, attempt = 1) {
    const MAX_RETRIES = 3;
    try {
        const auth = await getGoogleAuth(attempt > 1); // Force refresh if this is a retry
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth: await auth.getClient() });
        const spreadsheetId = process.env.SPREADSHEET_ID || SPREADSHEET_ID;
        // 1. Locate Active Signal Row
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'MZANZI_ENGINE!A:C',
        });
        const rows = sheetData.data.values || [];
        const rowIndex = rows.findIndex(row => row[2] === phone) + 1;
        if (rowIndex <= 0)
            throw new Error(`Signal ${phone} not found in Engine`);
        broadcastLog('INFO', `📡 LEDGER_SYNC_INITIATED: Row ${rowIndex} [${status}]`);
        // 2. Capture Live Telemetry from Twilio
        let duration = '0';
        try {
            const call = await getTwilioClient().calls(callSid).fetch();
            duration = call.duration || '0';
        }
        catch (err) {
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
                        status, // Column F: Current_Status
                        aiOutput, // Column G: AI_Output
                        now.toLocaleDateString(), // Column H: Call_Date
                        now.toLocaleTimeString(), // Column I: Call_Time
                        duration // Column J: Duration_Sec
                    ]]
            }
        });
        console.log(`✅ Sync Success on Attempt ${attempt} — Row ${rowIndex} [${status}] (duration: ${duration}s)`);
        broadcastLog('INFO', `✅ LEDGER_SYNC_COMPLETE: Row ${rowIndex} [${status}] (${duration}s)`);
        activeCalls.delete(callSid);
    }
    catch (err) {
        if (attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff (2s, 4s...)
            console.warn(`⚠️ Sync Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            broadcastLog('WARN', `⚠️ SYNC_RETRY: Attempt ${attempt} failed, retrying in ${delay}ms...`);
            setTimeout(() => logCallToIntelligenceLedger(phone, status, aiOutput, callSid, attempt + 1), delay);
        }
        else {
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
    const text = req.query.text;
    const language = req.query.lang;
    if (!text)
        return res.sendStatus(400);
    try {
        const audioBuffer = await voiceService_1.voiceService.generateAudio(text, { language });
        res.set({
            'Content-Type': 'audio/basic',
            'Content-Length': audioBuffer.length
        });
        res.send(buffer_1.Buffer.from(audioBuffer));
    }
    catch (err) {
        console.error("Audio Fail:", err);
        res.sendStatus(500);
    }
});
// helper to wrap mu-law buffer into WAV file (16-bit PCM) for browser playback
function mulawTo16Bit(sample) {
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
function muLawToWav(muLawBuf, sampleRate = 8000) {
    const numSamples = muLawBuf.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = bytesPerSample * 1;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * bytesPerSample;
    const buffer = buffer_1.Buffer.alloc(44 + dataSize);
    let offset = 0;
    // RIFF header
    buffer.write('RIFF', offset);
    offset += 4;
    buffer.writeUInt32LE(36 + dataSize, offset);
    offset += 4;
    buffer.write('WAVE', offset);
    offset += 4;
    // fmt chunk
    buffer.write('fmt ', offset);
    offset += 4;
    buffer.writeUInt32LE(16, offset);
    offset += 4; // subchunk1 size
    buffer.writeUInt16LE(1, offset);
    offset += 2; // PCM
    buffer.writeUInt16LE(1, offset);
    offset += 2; // num channels
    buffer.writeUInt32LE(sampleRate, offset);
    offset += 4;
    buffer.writeUInt32LE(byteRate, offset);
    offset += 4;
    buffer.writeUInt16LE(blockAlign, offset);
    offset += 2;
    buffer.writeUInt16LE(16, offset);
    offset += 2; // bits per sample
    // data chunk
    buffer.write('data', offset);
    offset += 4;
    buffer.writeUInt32LE(dataSize, offset);
    offset += 4;
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
    if (!text)
        return res.status(400).json({ error: "No text provided" });
    try {
        console.log(`🧪 Testing Voice: ${text}`);
        const audioBuffer = await voiceService_1.voiceService.generateAudio(text, { allowFallback: false, format: 'wav', language });
        res.json({ success: true, audioBase64: buffer_1.Buffer.from(audioBuffer).toString('base64') });
    }
    catch (err) {
        console.error("Voice Test Fail:", err);
        // include the error message if available for better diagnostics
        res.status(500).json({ error: "Failed to generate test audio", details: err?.message || err });
    }
});
// 7. LOGIC TESTER (Neural Lab)
app.post('/api/test-logic', async (req, res) => {
    const { text } = req.body;
    if (!text)
        return res.status(400).json({ error: "No text provided" });
    try {
        console.log(`🧠 Testing Logic: ${text}`);
        const aiResponse = await azureOpenAiService_1.aiService.generateResponse(text);
        res.json({ success: true, response: aiResponse });
    }
    catch (err) {
        console.error("Logic Test Fail:", err);
        res.status(500).json({ error: "Failed to generate logic response" });
    }
});
async function startServer() {
    // Global Error Handler for API routes
    app.use('/api', (err, req, res, next) => {
        console.error('🔥 API Error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        });
    });
    if (process.env.NODE_ENV !== 'production') {
        // Dynamic import of Vite — only in dev mode, keeps production bundle lean
        const { createServer: createViteServer } = await Promise.resolve().then(() => __importStar(require('vite')));
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    else {
        const distDir = resolveFrontendDistDir();
        if (!distDir) {
            throw new Error('Unable to locate frontend dist directory. Expected dist/index.html.');
        }
        app.use(express_1.default.static(distDir));
        app.get('*', (req, res) => {
            res.sendFile(path_1.default.join(distDir, 'index.html'));
        });
    }
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 JB³Ai Neural Hub Backend running on port ${PORT}`);
    });
}
startServer().catch((err) => {
    console.error('💥 Fatal server startup error:', err);
    process.exit(1);
});
