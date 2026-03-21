
import { GoogleGenAI, Modality, Type, LiveServerMessage, Blob } from "@google/genai";
import { Client, Language, LeadData, CallConfig } from "../types";

// Azure OpenAI failsafe for text generation
const azureEndpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_AI_ENDPOINT || '').replace(/\/$/, '');
const azureKey = process.env.AZURE_OPENAI_API_KEY || '';
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

async function azureChat(messages: Array<{role: string; content: any}>, jsonMode = false): Promise<string> {
  if (!azureEndpoint || !azureKey) throw new Error('Azure OpenAI not configured');
  const url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`;
  const body: any = { messages, temperature: 0.3, max_tokens: 2000 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Azure OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generates a dynamic system prompt based on user configuration.
 */
function buildSystemPrompt(config: CallConfig): string {
  const langRules = config.enabledLanguages.map((lang: Language) => {
    // base language instruction
    let base: string;
    switch (lang) {
      case Language.ZULU:
        base = "- If the user speaks **isiZulu** (zu-ZA), switch to isiZulu immediately. Use 'Sawubona'.";
        break;
      case Language.XHOSA:
        base = "- If the user speaks **isiXhosa** (xh-ZA), switch to isiXhosa immediately. Use 'Molo'.";
        break;
      case Language.AFRIKAANS:
        base = "- If the user speaks **Afrikaans** (af-ZA), switch to Afrikaans immediately. Use 'Goeie dag'.";
        break;
      case Language.SEPEDI:
        base = "- If the user speaks **Sepedi / Northern Sotho** (nso-ZA), switch to Sepedi immediately. Use 'Dumela'. Ensure your pronunciation and vocabulary follow the Northern Sotho (nso-ZA) dialect for the region.";
        break;
      case Language.PORTUGUESE:
        base = "- If the user speaks **Portuguese** (pt-PT), switch to Portuguese immediately. Tone: Direct & Energetic. Focus on efficiency and long-term 'Sistemas' reliability.";
        break;
      case Language.GREEK:
        base = "- If the user speaks **Greek** (el-GR), switch to Greek immediately. Tone: Executive & Tactical. Emphasize 'Logiki' (Logic) and the outcome of the solar transition.";
        break;
      case Language.MANDARIN:
        base = "- If the user speaks **Mandarin** (zh-CN), switch to Mandarin immediately. Tone: High-Speed & Precise. Use a very direct Problem → System → Outcome framework.";
        break;
      default:
        base = "- Use English as the fallback base language.";
    }

    // append custom phrases if provided
    const custom = config.customPhrases?.[lang];
    if (custom) {
      if (custom.greeting) {
        base += ` Greeting should begin with \"${custom.greeting}\".`;
      }
      if (custom.objection) {
        base += ` If the user raises an objection, use \"${custom.objection}\" to address it.`;
      }
      if (custom.closing) {
        base += ` Close the call with \"${custom.closing}\".`;
      }
      if (custom.signalSwitch) {
        base += ` When switching language or giving a signal, say \"${custom.signalSwitch}\".`;
      }
    }

    return base;
  }).join('\n');

  const defaultLangName = config.defaultLanguage === Language.ZULU ? 'isiZulu' :
                        config.defaultLanguage === Language.XHOSA ? 'isiXhosa' :
                        config.defaultLanguage === Language.AFRIKAANS ? 'Afrikaans' :
                        config.defaultLanguage === Language.SEPEDI ? 'Sepedi' : 'English';

  return `
You are Zandi, a friendly and professional qualification agent for ${config.companyName || 'our enterprise'}.
Your primary mission: ${config.objectives || 'Verify client details for a signup.'}

**CRITICAL LANGUAGE RULES (The Polyglot Engine):**
1. **Default:** Start the call in **${defaultLangName}** unless instructed otherwise.
2. **Detection:** Listen CAREFULLY. You are configured to auto-detect and switch to: ${config.enabledLanguages.join(', ')}.
${langRules}
3. **Ubuntu Spirit:** Remain warm and respectful. Stay in the detected language to build trust.

**DATA PARAMETERS TO CAPTURE:**
${config.parameters.map((p: string) => `- ${p}`).join('\n')}

**CONVERSATION STAGE:**
1. Greeting & Identity Verification.
2. Information Gathering based on parameters.
3. Marketing Consent.
4. Professional Closing.
`;
}

export class GeminiLiveService {
  // Added this method to support text generation in server.ts
  async generateResponse(prompt: string): Promise<string> {
    // Primary: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        return response.text || '';
      } catch (geminiErr) {
        console.warn('[Zandi] Gemini generateResponse failed, falling back to Azure:', geminiErr);
      }
    }
    // Fallback: Azure OpenAI
    return azureChat([{ role: 'user', content: prompt }]);
  }

  async connect(options: {
    client: Client;
    config: CallConfig;
    onTranscription: (text: string, role: 'user' | 'model') => void;
    onAudioData: (base64: string) => void;
    onInterrupted: () => void;
    onTurnComplete: () => void;
    onError: (err: any) => void;
  }) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        systemInstruction: buildSystemPrompt(options.config),
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: 'Kore' 
            } 
          },
        },
      },
      callbacks: {
        onopen: () => console.log('Zandi Uplink: Active'),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn) {
            const part = message.serverContent.modelTurn.parts?.[0];
            if (part?.inlineData?.data) {
              options.onAudioData(part.inlineData.data);
            }
          }
          
          if (message.serverContent?.outputTranscription?.text) {
            options.onTranscription(message.serverContent.outputTranscription.text, 'model');
          } else if (message.serverContent?.inputTranscription?.text) {
            options.onTranscription(message.serverContent.inputTranscription.text, 'user');
          }
          
          if (message.serverContent?.interrupted) {
            options.onInterrupted();
          }
          
          if (message.serverContent?.turnComplete) {
            options.onTurnComplete();
          }
        },
        onerror: (e) => {
          console.error("Zandi Error:", e);
          options.onError(e);
        },
        onclose: () => console.log('Zandi Uplink: Closed'),
      },
    });
    
    return sessionPromise;
  }

  async extractLeadData(transcript: string, config: CallConfig): Promise<{ status: 'qualified' | 'failed', data: LeadData, languageUsed: string }> {
    const extractPrompt = `Analyze this qualification transcript. 
      Target Company: ${config.companyName}
      Requested Parameters: ${config.parameters.join(', ')}
      
      Transcript:
      ${transcript}
      
      Return a JSON object with: status ("qualified" or "failed"), languageUsed (BCP-47 tag e.g. en-ZA), and data (name, email, phone, marketingPreference, custom_parameters_json).`;

    const parseResult = (text: string) => {
      const result = JSON.parse(text);
      if (result.data?.custom_parameters_json) {
        try { result.data.custom_parameters = JSON.parse(result.data.custom_parameters_json); } catch (_) {}
      }
      return { status: result.status, data: result.data, languageUsed: result.languageUsed };
    };

    // Primary: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: extractPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, enum: ['qualified', 'failed'] },
                languageUsed: { type: Type.STRING, description: "BCP-47 language tag" },
                data: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    marketingPreference: { type: Type.STRING, enum: ['email', 'sms', 'none'] },
                    custom_parameters_json: { type: Type.STRING }
                  }
                }
              },
              required: ['status', 'data', 'languageUsed']
            }
          }
        });
        return parseResult(response.text || '{}');
      } catch (geminiErr) {
        console.warn('[Zandi] Gemini extractLeadData failed, falling back to Azure:', geminiErr);
      }
    }

    // Fallback: Azure OpenAI
    try {
      const text = await azureChat([
        { role: 'system', content: 'You are a lead qualification analyst. Extract structured data from call transcripts. Return ONLY valid JSON.' },
        { role: 'user', content: extractPrompt }
      ], true);
      return parseResult(text);
    } catch (azureErr) {
      console.error('[Zandi] Azure extractLeadData also failed:', azureErr);
      return { status: 'failed', data: {}, languageUsed: 'unknown' };
    }
  }
}

// Export singleton for server.ts
export const geminiService = new GeminiLiveService();

export function encodeAudio(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function createAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
