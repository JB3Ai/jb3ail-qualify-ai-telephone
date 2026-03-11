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
exports.voiceService = void 0;
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const axios_1 = __importDefault(require("axios"));
const DEFAULT_VOICE_NAME = 'en-ZA-LeahNeural';
const VOICE_CANDIDATES_BY_LANGUAGE = {
    'en-za': ['en-ZA-LeahNeural', 'en-ZA-LukeNeural', 'en-GB-SoniaNeural', 'en-US-AvaMultilingualNeural'],
    'zu-za': ['zu-ZA-ThandoNeural', 'en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-ZA-LeahNeural'],
    'xh-za': ['xh-ZA-LukhoNeural', 'en-US-AvaMultilingualNeural', 'en-ZA-LeahNeural'],
    'af-za': ['af-ZA-AdriNeural', 'af-ZA-WillemNeural', 'en-ZA-LeahNeural'],
    'nso-za': ['zu-ZA-ThandoNeural', 'en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-ZA-LeahNeural'],
    'pt-pt': ['pt-PT-RaquelNeural', 'pt-PT-DuarteNeural', 'en-US-AvaMultilingualNeural'],
    'el-gr': ['el-GR-AthinaNeural', 'el-GR-NestorasNeural', 'en-US-AvaMultilingualNeural'],
    'zh-cn': ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'en-US-AvaMultilingualNeural'],
};
const PRONUNCIATION_ALIASES_BY_LANGUAGE = {
    'en-za': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'Zandi', alias: 'Zahn-dee' },
        { term: 'JB3Ai', alias: 'J B three A I' },
        { term: 'POPIA', alias: 'poh-pee-ah' },
    ],
    'af-za': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'Zandi', alias: 'Zahn-dee' },
        { term: 'JB3Ai', alias: 'J B three A I' },
        { term: 'POPIA', alias: 'poh-pee-ah' },
        { term: 'Goeiedag', alias: 'khoo-yee-dakh' },
        { term: 'huiseienaar', alias: 'hoys-eye-uh-naar' },
        { term: 'besonderhede', alias: 'buh-zon-der-hay-duh' },
        { term: 'verifieer', alias: 'veh-ri-feer' },
        { term: 'koers', alias: 'koors' },
        { term: 'bevestiging', alias: 'buh-fes-ti-ghing' },
        { term: 'Geniet u dag verder', alias: 'guh-neet uu dakh fer-der' },
        { term: 'sonkrag', alias: 'son-krahkh' },
        { term: 'Inisialiseer', alias: 'ee-nee-see-ah-lee-seer' },
    ],
    'zu-za': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
        { term: 'Sawubona', alias: 'sah-woo-boh-nah' },
        { term: 'Ngiyaxolisa', alias: 'ngee-yah-kho-lee-sah' },
        { term: 'Ngiyabonga', alias: 'ngee-yah-bon-gah' },
        { term: 'ngesiZulu', alias: 'ng-geh-see-zoo-loo' },
    ],
    'xh-za': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
    ],
    'nso-za': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
        { term: 'Dumela', alias: 'doo-meh-lah' },
        { term: 'tšea', alias: 'tseh-ah' },
        { term: 'netefatša', alias: 'neh-teh-fah-tsha' },
        { term: 'dintlha', alias: 'deen-tla' },
    ],
    'pt-pt': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
    ],
    'el-gr': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
    ],
    'zh-cn': [
        { term: 'Mzansi', alias: 'M-zahn-see' },
        { term: 'JB3Ai', alias: 'J B three A I' },
    ],
};
function normalizeLanguage(language) {
    return (language || '').trim().toLowerCase();
}
function resolveVoiceCandidates(language) {
    const normalized = normalizeLanguage(language);
    const candidates = VOICE_CANDIDATES_BY_LANGUAGE[normalized] || [DEFAULT_VOICE_NAME];
    return Array.from(new Set([...candidates, DEFAULT_VOICE_NAME]));
}
function resolveLocale(language) {
    const normalized = normalizeLanguage(language);
    return normalized || 'en-ZA';
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function buildSsmlText(text, language) {
    const normalized = normalizeLanguage(language);
    const aliases = PRONUNCIATION_ALIASES_BY_LANGUAGE[normalized] || [];
    if (!aliases.length) {
        return escapeXml(text);
    }
    let withTokens = text;
    const tokenMappings = [];
    aliases.forEach((entry, index) => {
        const token = `__ALIAS_${index}__`;
        const regex = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, 'gi');
        withTokens = withTokens.replace(regex, token);
        tokenMappings.push({ token, term: entry.term, alias: entry.alias });
    });
    let escaped = escapeXml(withTokens);
    tokenMappings.forEach(({ token, term, alias }) => {
        const replacement = `<sub alias="${escapeXml(alias)}">${escapeXml(term)}</sub>`;
        escaped = escaped.split(token).join(replacement);
    });
    return escaped;
}
function buildSsmlDocument(text, locale, voiceName, language) {
    const body = buildSsmlText(text, language);
    return `<speak version='1.0' xml:lang='${locale}'><voice xml:lang='${locale}' name='${voiceName}'><prosody rate='-3%'>${body}</prosody></voice></speak>`;
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
async function synthesizeWavViaRest(text, key, region, voiceName, locale) {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = buildSsmlDocument(text, locale, voiceName, locale);
    const response = await axios_1.default.post(endpoint, ssml, {
        responseType: 'arraybuffer',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
            'User-Agent': 'jb3ai-neural-hub',
        },
        timeout: 15000,
    });
    return new Uint8Array(response.data);
}
async function synthesizeMuLawViaSdk(text, key, region, voiceName, locale, language) {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const ssml = buildSsmlDocument(text, locale, voiceName, language);
    return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(ssml, (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                resolve(new Uint8Array(result.audioData));
            }
            else {
                reject(new Error(result.errorDetails || 'Speech synthesis failed'));
            }
            synthesizer.close();
        }, (error) => {
            synthesizer.close();
            reject(new Error(String(error)));
        });
    });
}
// helper: simple mu-law encoder (input sample in [-1,1])
function linearToMuLaw(sample) {
    const MU = 255;
    const sign = sample < 0 ? 1 : 0;
    let magnitude = Math.min(1, Math.abs(sample));
    const muLawSample = sign * 0x80 | (Math.log(1 + MU * magnitude) / Math.log(1 + MU) * 0x7F);
    return muLawSample & 0xFF;
}
// generate a sine wave fallback in mu-law format
function generateSineFallback(durationSeconds = 1, sampleRate = 8000, freq = 440) {
    const length = Math.floor(durationSeconds * sampleRate);
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * freq * t);
        out[i] = linearToMuLaw(sample);
    }
    return out;
}
exports.voiceService = {
    async generateAudio(text, options) {
        const allowFallback = options?.allowFallback ?? true;
        const format = options?.format ?? 'mulaw';
        const locale = resolveLocale(options?.language);
        const voiceCandidates = resolveVoiceCandidates(options?.language);
        const inputText = text.trim();
        const speechKey = (process.env.SPEECH_KEY || '').trim();
        const speechRegion = (process.env.SPEECH_REGION || '').trim().toLowerCase();
        if (!inputText) {
            const message = 'Text is empty';
            if (!allowFallback) {
                throw new Error(message);
            }
            return generateSineFallback();
        }
        if (!speechKey || !speechRegion) {
            const message = 'SPEECH_KEY or SPEECH_REGION missing';
            console.warn(`⚠️ ${message}${allowFallback ? ', returning fallback tone' : ''}`);
            if (!allowFallback) {
                throw new Error(message);
            }
            return generateSineFallback();
        }
        if (format === 'wav') {
            let lastMessage = 'Azure Speech REST synthesis failed';
            for (const voiceName of voiceCandidates) {
                try {
                    return await synthesizeWavViaRest(inputText, speechKey, speechRegion, voiceName, locale);
                }
                catch (error) {
                    const status = error?.response?.status;
                    const details = error?.response?.data ? Buffer.from(error.response.data).toString('utf8') : '';
                    lastMessage = `Azure Speech REST synthesis failed${status ? ` (HTTP ${status})` : ''}${details ? `: ${details}` : ''}`;
                }
            }
            console.error(lastMessage);
            if (!allowFallback) {
                throw new Error(lastMessage);
            }
        }
        let lastSdkMessage = 'Speech synthesis failed';
        for (const voiceName of voiceCandidates) {
            try {
                return await synthesizeMuLawViaSdk(inputText, speechKey, speechRegion, voiceName, locale, options?.language);
            }
            catch (error) {
                lastSdkMessage = String(error?.message || error || 'Speech synthesis failed');
            }
        }
        if (!allowFallback) {
            throw new Error(lastSdkMessage);
        }
        return generateSineFallback();
    }
};
