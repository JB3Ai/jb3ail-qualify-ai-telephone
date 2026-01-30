import 'dotenv/config';
import express, { RequestHandler } from 'express';
import { createServer } from 'http';
import Twilio from 'twilio';
import { voiceService } from './services/voiceService';
import { geminiService } from './services/geminiService';
import { clientService } from './services/clientService';

const app = express();
const server = createServer(app);
const PORT = 3001; // Runs on 3001 to not block your Dashboard (3000)

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.use(express.json());
// Fix: Added explicit cast to RequestHandler to satisfy Express type overloads
app.use(express.urlencoded({ extended: true }) as RequestHandler);

// 1. Health Check
app.get('/', (req, res) => {
  res.send('🚀 MzansiBot Backend is Online!');
});

// 2. TRIGGER CALL
app.all('/make-call', async (req, res) => {
  try {
    const clients = clientService.getClients();
    const targetClient = clients.find(c => c.status === 'pending');

    if (!targetClient) {
      return res.status(404).send("No pending clients found.");
    }

    console.log(`☎️ Dialing ${targetClient.name}...`);

    const call = await client.calls.create({
      to: targetClient.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `https://${process.env.DOMAIN}/voice-handler`,
      timeout: 60
    });

    res.send({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error("Twilio Error:", error);
    res.status(500).send({ error: error.message });
  }
});

// 3. VOICE HANDLER
app.all('/voice-handler', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  const welcomeText = "Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with the homeowner?";

  try {
    const gather = twiml.gather({
      input: ['speech'],
      action: '/handle-response',
      language: 'en-ZA',
      speechTimeout: 'auto'
    });

    gather.play(`https://${process.env.DOMAIN}/audio-stream?text=${encodeURIComponent(welcomeText)}`);
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

  if (!userSpeech) {
    twiml.redirect('/voice-handler');
    return;
  }

  // Uses the newly added generateResponse method in geminiService
  const aiResponse = await geminiService.generateResponse(userSpeech);

  const gather = twiml.gather({
    input: ['speech'],
    action: '/handle-response',
    language: 'en-ZA'
  });

  gather.play(`https://${process.env.DOMAIN}/audio-stream?text=${encodeURIComponent(aiResponse)}`);

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
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("Audio Fail:", err);
    res.sendStatus(500);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 MzansiBot Backend running on port ${PORT}`);
});
