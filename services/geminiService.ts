
import { GoogleGenAI, Modality, Type, LiveServerMessage, Blob } from "@google/genai";
import { Client, Language, LeadData, CallConfig } from "../types";

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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Upgrade to gemini-3-pro-preview for complex reasoning tasks like transcript analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this qualification transcript. 
      Target Company: ${config.companyName}
      Requested Parameters: ${config.parameters.join(', ')}
      
      Transcript:
      ${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['qualified', 'failed'] },
            languageUsed: { 
              type: Type.STRING, 
              description: "The BCP-47 language tag of the language detected (e.g., 'en-ZA', 'zu-ZA', 'nso-ZA')." 
            },
            data: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                marketingPreference: { type: Type.STRING, enum: ['email', 'sms', 'none'] },
                // Fix: Type.OBJECT must have properties. Changing to string for flexible JSON capture of dynamic parameters.
                custom_parameters_json: { 
                  type: Type.STRING, 
                  description: "A JSON string containing any extra parameters captured that were not in the standard fields."
                }
              }
            }
          },
          required: ['status', 'data', 'languageUsed']
        }
      }
    });

    try {
      const result = JSON.parse(response.text || '{}');
      // Re-map the custom_parameters if needed
      if (result.data.custom_parameters_json) {
        try {
          result.data.custom_parameters = JSON.parse(result.data.custom_parameters_json);
        } catch (e) {
          console.warn("Failed to parse custom_parameters_json");
        }
      }
      return {
        status: result.status,
        data: result.data,
        languageUsed: result.languageUsed
      };
    } catch (e) {
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
