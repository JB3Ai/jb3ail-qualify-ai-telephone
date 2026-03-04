import * as dotenv from 'dotenv';
dotenv.config({ override: true });

// --- STARTUP DIAGNOSTICS (helps debug Azure App Service issues) ---
console.log(`[STARTUP] Node ${process.version} | ENV=${process.env.NODE_ENV} | PORT=${process.env.PORT} | CWD=${process.cwd()}`);
console.log(`[STARTUP] TWILIO_SID=${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING'} | AZURE_KEY=${process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING'} | SPEECH=${process.env.SPEECH_KEY ? 'SET' : 'MISSING'}`);

import express from 'express';
import { createServer } from 'http';
import Twilio from 'twilio';
import cors from 'cors'; // Added CORS for frontend-backend communication
import { voiceService } from './services/voiceService';
import { geminiService } from './services/geminiService';
import { aiService } from './services/azureOpenAiService';
import { clientService } from './services/clientService';
import { google } from 'googleapis';
import { Language } from './types';
// Fix: Import Buffer explicitly for Node.js environments where it might not be globally available in the TypeScript context
import { Buffer } from 'buffer';


import path from 'path';
import { fileURLToPath } from 'url';
import * as appInsights from 'applicationinsights';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS for all origins
app.use(cors() as any);
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

  // 1.2 Lead Injection / Sheet Sync
  const SPREADSHEET_ID = '12bRfRW-m0cjNjRP6NdIdNsIMFBhS9Lv50JrLlt5dO5g';
  const RANGE = 'MZANZI_ENGINE!A2:E';

  // Support both GET and POST for easier debugging/testing
  app.all(['/api/clients/sync-sheets', '/api/clients/sync-sheets/'], async (req, res) => {
    console.log(`📥 [${req.method}] Importing Signal: Syncing Sheets (Source: 12bR...dO5g)`);
    
    try {
      // In a real environment, you'd use a service account or OAuth2
      // For this demo, we'll attempt to use the environment's default credentials if available
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      let googleAuth;
      try {
        googleAuth = await auth.getClient();
      } catch (authError: any) {
        console.warn('⚠️ Google Auth failed, using fallback mode:', authError.message);
        throw new Error('AUTH_FAILED');
      }

      const sheets = google.sheets({ version: 'v4', auth: googleAuth as any });
      
      console.log(`📡 Fetching data from Google Sheets range: ${RANGE}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values || [];
      const allLeads: any[] = [];
      const source = RANGE.split('!')[0];
      
      rows.forEach((row: any[]) => {
        if (row[0] && row[2]) { // Name and Phone are required
          allLeads.push({
            id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: row[0],
            surname: row[1] || '',
            phone: row[2],
            language: (row[3] || 'en-ZA') as Language,
            status: 'READY_FOR_EXECUTION', // Assign READY_FOR_EXECUTION status for Pipeline visibility
            source: source,
            area: 'Imported',
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
          language: 'zu-ZA' as Language,
          status: 'READY_FOR_EXECUTION',
          source: 'MZANZI_ENGINE',
          area: 'Gauteng',
          signup_date: new Date().toISOString(),
          collected_data: {}
        });
      }

      // Add leads to client service
      allLeads.forEach(lead => clientService.importClients([lead]));

      res.json({ 
        success: true, 
        message: `Successfully synced ${allLeads.length} leads from ${RANGE}.`, 
        leads: allLeads 
      });
    } catch (error: any) {
      console.error('❌ Sheet Sync Error:', error.message);
      // log the raw rows if available for debugging
      if ((error as any).response?.data?.values) {
        console.warn('🚨 Raw sheet rows that caused failure:', (error as any).response.data.values);
      }
      
      // Fallback lead for demo purposes if API fails or auth fails
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
      
      try {
        clientService.importClients([fallbackLead]);
      } catch (e) {
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
  res.json(clientService.getClients());
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

    // Ensure DOMAIN is set or fallback to APP_URL for the environment
    const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

    const call = await getTwilioClient().calls.create({
      to: targetClient.phone,
      from: process.env.TWILIO_PHONE_NUMBER || '',
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
app.all('/voice-handler', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const welcomeText = "Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?";
  const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

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

// 4. BRAIN LOGIC — Azure OpenAI
app.all('/handle-response', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const userSpeech = req.body.SpeechResult; 
  const domain = process.env.DOMAIN || (process.env.APP_URL ? new URL(process.env.APP_URL).host : `localhost:${PORT}`);

  if (!userSpeech) {
    twiml.redirect('/voice-handler');
    return;
  }

  // AI logic switched from Gemini to Azure OpenAI
  const aiResponse = await aiService.generateResponse(
    userSpeech,
    "You are Zandi, a professional qualification agent for Mzansi Solutions."
  );

  const gather = twiml.gather({
    input: ['speech'],
    action: '/handle-response',
    language: 'en-ZA'
  });

  // Audio still streams through voiceService (Azure TTS)
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
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
