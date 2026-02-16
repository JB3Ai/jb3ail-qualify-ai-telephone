
import 'dotenv/config';
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
app.get('/', (req, res) => {
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
      from: process.env.TWILIO_PHONE_NUMBER,
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

server.listen(PORT, () => {
  console.log(`🚀 MzansiBot Backend running on port ${PORT}`);
});
