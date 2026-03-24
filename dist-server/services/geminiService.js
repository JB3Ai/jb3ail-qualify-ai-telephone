"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiLiveService = void 0;
exports.encodeAudio = encodeAudio;
exports.decodeAudio = decodeAudio;
exports.createAudioBuffer = createAudioBuffer;
const genai_1 = require("@google/genai");
const types_1 = require("../types");
// Azure OpenAI failsafe for text generation
const azureEndpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_AI_ENDPOINT || '').replace(/\/$/, '');
const azureKey = process.env.AZURE_OPENAI_API_KEY || '';
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
async function azureChat(messages, jsonMode = false) {
    if (!azureEndpoint || !azureKey)
        throw new Error('Azure OpenAI not configured');
    const url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`;
    const body = { messages, temperature: 0.3, max_tokens: 2000 };
    if (jsonMode)
        body.response_format = { type: 'json_object' };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`Azure OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}
/**
 * Generates a dynamic system prompt based on user configuration.
 */
function buildSystemPrompt(config) {
    const langRules = config.enabledLanguages.map((lang) => {
        // base language instruction
        let base;
        switch (lang) {
            case types_1.Language.ENGLISH:
                base = "- If the user speaks **English** (en-ZA), keep a neutral South African business accent. Do not use US or UK slang. If the conversation touches energy systems, prefer 'load-shedding', 'Eskom', and 'inverter'.";
                break;
            case types_1.Language.ZULU:
                base = "- If the user speaks **isiZulu** (zu-ZA), switch to isiZulu immediately. Use 'Sawubona'. Do not translate their isiZulu back into the previous language.";
                break;
            case types_1.Language.XHOSA:
                base = "- If the user speaks **isiXhosa** (xh-ZA), switch to isiXhosa immediately. Use 'Molo'. Do not translate their isiXhosa back into the previous language.";
                break;
            case types_1.Language.AFRIKAANS:
                base = "- If the user speaks **Afrikaans** (af-ZA), switch to Afrikaans immediately. Use 'Goeie dag'. Do not translate their Afrikaans back into the previous language.";
                break;
            case types_1.Language.SEPEDI:
                base = "- If the user speaks **Sepedi / Northern Sotho** (nso-ZA), switch to Sepedi immediately. Use 'Dumela'. Ensure your pronunciation and vocabulary follow the Northern Sotho (nso-ZA) dialect for the region. Keep tonal delivery steady and avoid rising sentence endings that sound uncertain. Do not translate their Sepedi back into the previous language.";
                break;
            case types_1.Language.PORTUGUESE:
                base = "- If the user speaks **Portuguese** (pt-BR or pt-PT), switch to Portuguese immediately. Open with 'Bom dia'. Adapt for the Lusophone community in South Africa and prioritize clarity over speed. Do not translate their Portuguese back into the previous language.";
                break;
            case types_1.Language.GREEK:
                base = "- If the user speaks **Greek** (el-GR), switch to Greek immediately. Open with 'Yiasas'. Keep a direct, high-trust business tone. Do not translate their Greek back into the previous language.";
                break;
            case types_1.Language.MANDARIN:
                base = "- If the user speaks **Mandarin** (zh-CN), switch to formal business Mandarin immediately. Avoid regional dialects unless the signal originated from a specific trade node. Keep responses precise and do not translate their Mandarin back into the previous language.";
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
    const defaultLangName = config.defaultLanguage === types_1.Language.ZULU ? 'isiZulu' :
        config.defaultLanguage === types_1.Language.XHOSA ? 'isiXhosa' :
            config.defaultLanguage === types_1.Language.AFRIKAANS ? 'Afrikaans' :
                config.defaultLanguage === types_1.Language.SEPEDI ? 'Sepedi' : 'English';
    return `
You are Zandi, a friendly and professional qualification agent for ${config.companyName || 'our enterprise'}.
Your primary mission: ${config.objectives || 'Verify client details for a signup.'}

**CRITICAL LANGUAGE RULES (The Polyglot Engine):**
1. **Default:** Start the call in **${defaultLangName}** unless instructed otherwise.
2. **Detection:** Listen CAREFULLY. You are configured to auto-detect and switch to: ${config.enabledLanguages.join(', ')}.
${langRules}
3. **Ubuntu Spirit:** Remain warm and respectful. Stay in the detected language to build trust.
4. **No Translation Lock:** When the speaker changes to another supported language, reply in that language immediately. Do not translate their words into the language you were previously speaking.
5. **Mixed Utterances:** If the caller mixes languages, follow the newest or dominant supported language naturally and continue there.

**DATA PARAMETERS TO CAPTURE:**
${config.parameters.map((p) => `- ${p}`).join('\n')}

**CONVERSATION STAGE:**
1. Greeting & Identity Verification.
2. Information Gathering based on parameters.
3. Marketing Consent.
4. Professional Closing.
`;
}
class GeminiLiveService {
    // Added this method to support text generation in server.ts
    async generateResponse(prompt) {
        // Primary: Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                return response.text || '';
            }
            catch (geminiErr) {
                console.warn('[Zandi] Gemini generateResponse failed, falling back to Azure:', geminiErr);
            }
        }
        // Fallback: Azure OpenAI
        return azureChat([{ role: 'user', content: prompt }]);
    }
    async connect(options) {
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                systemInstruction: buildSystemPrompt(options.config),
                responseModalities: [genai_1.Modality.AUDIO],
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
                onmessage: async (message) => {
                    if (message.serverContent?.modelTurn) {
                        const part = message.serverContent.modelTurn.parts?.[0];
                        if (part?.inlineData?.data) {
                            options.onAudioData(part.inlineData.data);
                        }
                    }
                    if (message.serverContent?.outputTranscription?.text) {
                        options.onTranscription(message.serverContent.outputTranscription.text, 'model');
                    }
                    else if (message.serverContent?.inputTranscription?.text) {
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
    async extractLeadData(transcript, config) {
        const extractPrompt = `Analyze this qualification transcript. 
      Target Company: ${config.companyName}
      Requested Parameters: ${config.parameters.join(', ')}
      
      Transcript:
      ${transcript}
      
      Return a JSON object with: status ("qualified" or "failed"), languageUsed (BCP-47 tag e.g. en-ZA), and data (name, email, phone, marketingPreference, custom_parameters_json).`;
        const parseResult = (text) => {
            const result = JSON.parse(text);
            if (result.data?.custom_parameters_json) {
                try {
                    result.data.custom_parameters = JSON.parse(result.data.custom_parameters_json);
                }
                catch (_) { }
            }
            return { status: result.status, data: result.data, languageUsed: result.languageUsed };
        };
        // Primary: Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: extractPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: genai_1.Type.OBJECT,
                            properties: {
                                status: { type: genai_1.Type.STRING, enum: ['qualified', 'failed'] },
                                languageUsed: { type: genai_1.Type.STRING, description: "BCP-47 language tag" },
                                data: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        name: { type: genai_1.Type.STRING },
                                        email: { type: genai_1.Type.STRING },
                                        phone: { type: genai_1.Type.STRING },
                                        marketingPreference: { type: genai_1.Type.STRING, enum: ['email', 'sms', 'none'] },
                                        custom_parameters_json: { type: genai_1.Type.STRING }
                                    }
                                }
                            },
                            required: ['status', 'data', 'languageUsed']
                        }
                    }
                });
                return parseResult(response.text || '{}');
            }
            catch (geminiErr) {
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
        }
        catch (azureErr) {
            console.error('[Zandi] Azure extractLeadData also failed:', azureErr);
            return { status: 'failed', data: {}, languageUsed: 'unknown' };
        }
    }
}
exports.GeminiLiveService = GeminiLiveService;
// Export singleton for server.ts
exports.geminiService = new GeminiLiveService();
function encodeAudio(data) {
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
function decodeAudio(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
async function createAudioBuffer(data, ctx, sampleRate = 24000, numChannels = 1) {
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
