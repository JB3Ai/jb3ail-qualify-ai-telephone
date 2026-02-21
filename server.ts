
import 'dotenv/config';
import fs from 'fs';
import { google } from 'googleapis';
import express from 'express';
import { createServer } from 'http';
import Twilio from 'twilio';
import cors from 'cors'; // Added CORS for frontend-backend communication
import { voiceService } from './services/voiceService';
import { geminiService } from './services/geminiService';
import { clientService } from './services/clientService';
// Fix: Import Buffer explicitly for Node.js environments where it might not be globally available in the TypeScript context
import { Buffer } from 'buffer';

const app = express();
const server = createServer(app);
const PORT = 3001;

// Enable CORS for all origins during development to fix "Failed to fetch"
// Fix: Cast middleware to any to resolve type mismatch with express app.use overloads
app.use(cors() as any);

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Fix: Cast middleware to any to resolve type mismatch with express app.use overloads
app.use(express.json() as any);
// Fix: Cast middleware to any to resolve type mismatch with express app.use overloads
app.use(express.urlencoded({ extended: true }) as any);

// 1. Health Check
app.get('/', (_req, res) => {
  res.send('🚀 MzansiBot Backend is Online!');
});

// 2. TRIGGER CALL
app.all('/make-call', async (req, res) => {
  try {
    const clients = clientService.getClients();
    // Fix: Use clientId from request body if available, fallback to first pending client
    const clientId = req.body.clientId;
    const targetClient = clientId
      ? clients.find(c => c.id === clientId)
      : clients.find(c => c.status === 'pending');

    if (!targetClient) {
      return res.status(404).json({ success: false, error: "No client found to dial." });
    }

    console.log(`☎️ Dialing ${targetClient.name}...`);

    // Ensure DOMAIN is set or fallback to localhost for local testing
    const domain = process.env.DOMAIN || `localhost:${PORT}`;

    const call = await client.calls.create({
      to: targetClient.phone,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `https://${domain}/voice-handler`,
      timeout: 60
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error("Twilio Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. VOICE HANDLER
app.all('/voice-handler', async (_req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const welcomeText = "Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?";
  const domain = process.env.DOMAIN || `localhost:${PORT}`;

  try {
    const gather = twiml.gather({
      input: ['speech'],
      action: '/handle-response',
      language: 'en-ZA',
      speechTimeout: 'auto'
    });

    gather.play(`https://${domain}/audio-stream?text=${encodeURIComponent(welcomeText)}`);
    twiml.redirect('/voice-handler');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// 4. BRAIN LOGIC
app.all('/handle-response', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const userSpeech = req.body.SpeechResult;
  const domain = process.env.DOMAIN || `localhost:${PORT}`;

  if (!userSpeech) {
    twiml.redirect('/voice-handler');
    return;
  }

  const aiResponse = await geminiService.generateResponse(userSpeech);

  const gather = twiml.gather({
    input: ['speech'],
    action: '/handle-response',
    language: 'en-ZA'
  });

  gather.play(`https://${domain}/audio-stream?text=${encodeURIComponent(aiResponse)}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// 5. AUDIO STREAMER
app.get('/audio-stream', async (req, res) => {
  const text = req.query.text as string;
  if (!text) return res.sendStatus(400);

  try {
    const audioBuffer = await voiceService.generateAudio(text);
    res.set({
      'Content-Type': 'audio/basic',
      'Content-Length': audioBuffer.length
    });
    // Fix: Use Buffer.from to wrap the Uint8Array for binary transmission in Express
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("Audio Fail:", err);
    res.sendStatus(500);
  }
});
// 6. LOCAL VOICE TEST (The Missing Link)
app.post('/api/speak', async (req, res) => {
  try {
    const { text, language } = req.body; // Accept language param
    if (!text) return res.status(400).json({ error: "No text provided" });

    console.log(`🎙️ Generating speech (${language || 'en'}): "${text}"`);
    // Pass language to voice service
    const audioBuffer = await voiceService.generateAudio(text, language);

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length
    });
    res.send(Buffer.from(audioBuffer));
  } catch (error: any) {
    console.error("Speech Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// IMPORT LEADS (Mock for now)
app.get('/api/clients', (_req, res) => {
  res.json(clientService.getClients());
});

// 7. IMPORT / LOAD LEADS (The "Preload" System)
app.post('/api/clients/import', (req, res) => {
  const lang = req.body.language || 'en';

  // 📦 JB³Ai PRELOADED DATA PACKS
  // These load instantly when "Load Team" is clicked
  const DATA_PACKS: Record<string, any[]> = {
    'en': [
      { id: 'en1', name: 'James Black', phone: '+27820000001', language: 'en' },
      { id: 'en2', name: 'Sarah Connor', phone: '+27820000002', language: 'en' },
      { id: 'en3', name: 'Elon Musk', phone: '+27820000003', language: 'en' },
      { id: 'en4', name: 'Tony Stark', phone: '+27820000004', language: 'en' }
    ],
    'af': [
      { id: 'af1', name: 'Pieter van der Merwe', phone: '+27820000011', language: 'af' },
      { id: 'af2', name: 'Johan Stemmet', phone: '+27820000012', language: 'af' },
      { id: 'af3', name: 'Karlien van Jaarsveld', phone: '+27820000013', language: 'af' },
      { id: 'af4', name: 'Rassie Erasmus', phone: '+27820000014', language: 'af' }
    ],
    'zu': [
      { id: 'zu1', name: 'Sipho Nkosi', phone: '+27820000021', language: 'zu' },
      { id: 'zu2', name: 'Nandi Madida', phone: '+27820000022', language: 'zu' },
      { id: 'zu3', name: 'Black Coffee', phone: '+27820000023', language: 'zu' },
      { id: 'zu4', name: 'Nomzamo Mbatha', phone: '+27820000024', language: 'zu' }
    ],
    'xh': [
      { id: 'xh1', name: 'Trevor Noah', phone: '+27820000031', language: 'xh' },
      { id: 'xh2', name: 'Zozibini Tunzi', phone: '+27820000032', language: 'xh' },
      { id: 'xh3', name: 'Thandiswa Mazwai', phone: '+27820000033', language: 'xh' },
      { id: 'xh4', name: 'John Kani', phone: '+27820000034', language: 'xh' }
    ],
    'nso': [
      { id: 'nso1', name: 'Caster Semenya', phone: '+27820000041', language: 'nso' },
      { id: 'nso2', name: 'Julius Malema', phone: '+27820000042', language: 'nso' },
      { id: 'nso3', name: 'King Sekhukhune', phone: '+27820000043', language: 'nso' },
      { id: 'nso4', name: 'Master KG', phone: '+27820000044', language: 'nso' }
    ]
  };

  const selectedPack = DATA_PACKS[lang] || DATA_PACKS['en'];

  // Clear memory and load the pack
  if (clientService.clearClients) {
    clientService.clearClients();
  }

  selectedPack.forEach(c => {
    // Adapt to Client interface
    c.status = 'pending';
    c.signup_date = new Date().toISOString();
    clientService.addClient(c);
  });

  console.log(`📦 LOADED PACK: ${lang.toUpperCase()} (${selectedPack.length} leads)`);
  res.json({ success: true, message: `Loaded ${selectedPack.length} ${lang.toUpperCase()} leads` });
});

// 8. DATA INBOX: ADC SYNC (With Robust Fallback)
app.post('/api/clients/sync-sheets', async (_req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    const range = 'Sheet1!A2:E';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error("No data in sheet");

    rows.forEach((row, index) => {
      clientService.addClient({
        id: `gsheet-live-${index}`,
        name: row[0],
        phone: row[1],
        language: row[2] || 'en',
        source: row[3] || 'IMPORT',
        status: 'pending',
        signup_date: new Date().toISOString()
      });
    });

    res.json({ success: true, count: rows.length, message: "Neural Link Established (Live Sheet)" });

  } catch (error) {
    console.error("Sheets Sync Error (Switching to Backup Protocol):", error);

    // FALLBACK MOCK DATA
    const mockLeads = [
      { id: 'backup-1', name: 'Jono (Solar Lead)', phone: '+27719691848', language: 'en', source: 'WHATSAPP', status: 'pending' },
      { id: 'backup-2', name: 'Office Work', phone: '+27793120688', language: 'af', source: 'EMAIL', status: 'pending' },
      { id: 'backup-3', name: 'Emma', phone: '+27829531997', language: 'zu', source: 'WEBSITE', status: 'pending' },
      { id: 'backup-4', name: 'Thabo Mbeki', phone: '+27821234567', language: 'xh', source: 'IMPORT', status: 'pending' },
      { id: 'backup-5', name: 'Steve Hofmeyr', phone: '+27827654321', language: 'af', source: 'PROMO', status: 'pending' }
    ];

    mockLeads.forEach(lead => clientService.addClient(lead as any));

    res.json({
      success: true,
      count: mockLeads.length,
      message: "⚠️ Signal Weak: Loaded Backup Neural Data (Offline Mode)"
    });
  }
});

// 9. POPIA COMPLIANCE LEDGER
app.post('/api/compliance/accept', (_req, res) => {
  const logEntry = `[${new Date().toISOString()}] PROTOCOL ACCEPTED: Operator initialized JB³Ai OS.\n`;
  try {
    fs.appendFileSync('compliance_audit.log', logEntry);
    res.json({ status: "Signal Logged" });
  } catch (e) {
    console.error("Audit Log Error:", e);
    res.status(500).json({ error: "Audit Log Failed" });
  }
});
server.listen(PORT, () => {
  console.log(`🚀 MzansiBot Backend running on port ${PORT}`);
});
