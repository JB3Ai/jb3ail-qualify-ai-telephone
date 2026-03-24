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
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceService = void 0;
exports.synthesizeSpeechStream = synthesizeSpeechStream;
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const textNormalizer_js_1 = require("../utils/textNormalizer.js");
// === THE VIRTUAL CALL CENTER: AZURE VOICE MATRIX ===
// Supports both human-readable labels and the BCP-47 locales the frontend actually sends.
const VOICE_MATRIX = {
    'english': 'en-ZA-LeahNeural',
    'en-za': 'en-ZA-LeahNeural',
    'zandi': 'en-ZA-LeahNeural',
    'luke': 'en-ZA-LukeNeural',
    'zulu': 'zu-ZA-ThembaNeural',
    'zu-za': 'zu-ZA-ThembaNeural',
    'thando': 'zu-ZA-ThembaNeural',
    'afrikaans': 'af-ZA-WillemNeural',
    'af-za': 'af-ZA-WillemNeural',
    'christiaan': 'af-ZA-WillemNeural',
    'adri': 'af-ZA-AdriNeural',
    'xhosa': 'xh-ZA-SiyandaNeural',
    'xh-za': 'xh-ZA-SiyandaNeural',
    'ayanda': 'xh-ZA-SiyandaNeural',
    'sepedi': 'nso-ZA-LeboNeural',
    'nso-za': 'nso-ZA-LeboNeural',
    'lebo': 'nso-ZA-LeboNeural',
    'greek': 'el-GR-NestorasNeural',
    'el-gr': 'el-GR-NestorasNeural',
    'kostas': 'el-GR-NestorasNeural',
    'portuguese': 'pt-PT-RaquelNeural',
    'pt-pt': 'pt-PT-RaquelNeural',
    'raquel': 'pt-PT-RaquelNeural',
    'pt-br': 'pt-BR-AntonioNeural',
    'mandarin': 'zh-CN-YunxiNeural',
    'zh-cn': 'zh-CN-YunxiNeural',
    'default': 'en-ZA-LeahNeural',
};
// Per-language SSML prosody — zero latency, prevents Azure hyper-articulation on Nguni voices
const PROSODY = {
    'en-za': { rate: '-2%' },
    'xh-za': { pitch: '-12%', rate: '-5%' },
    'zu-za': { pitch: '-5%', rate: '-5%' },
    'nso-za': { pitch: '-18%', rate: '-7%' },
    'af-za': { rate: '-3%' },
    'pt-pt': { rate: '-8%' },
    'pt-br': { rate: '-8%' },
    'el-gr': { rate: '-4%' },
    'zh-cn': { rate: '-2%' },
};
const DEFAULT_PROSODY = { rate: '-3%' };
const PHONETIC_BREAK_LOCALES = new Set(['nso-za', 'zh-cn']);
const TECHNICAL_TERM_PATTERN = /\b(Solar|Battery|Inverter|Eskom)\b([,:;]?)/gi;
function normalizeLocale(locale) {
    return (locale || '').trim().toLowerCase();
}
function toBcp47(normalized) {
    const [lang, region] = normalized.split('-');
    if (lang && region)
        return `${lang}-${region.toUpperCase()}`;
    return normalized || 'en-ZA';
}
function resolveVoice(locale) {
    const normalized = normalizeLocale(locale);
    return VOICE_MATRIX[normalized] ?? VOICE_MATRIX['default'];
}
function buildSsmlText(text, normalizedLocale) {
    const normalizedText = (0, textNormalizer_js_1.normalizeBrandText)(text);
    if (!PHONETIC_BREAK_LOCALES.has(normalizedLocale)) {
        return (0, textNormalizer_js_1.normalizeScript)(normalizedText);
    }
    let output = '';
    let lastIndex = 0;
    let match;
    TECHNICAL_TERM_PATTERN.lastIndex = 0;
    while ((match = TECHNICAL_TERM_PATTERN.exec(normalizedText)) !== null) {
        output += (0, textNormalizer_js_1.escapeXml)(normalizedText.slice(lastIndex, match.index));
        output += `${(0, textNormalizer_js_1.escapeXml)(match[1])}${(0, textNormalizer_js_1.escapeXml)(match[2] || '')}<break time='200ms'/>`;
        lastIndex = match.index + match[0].length;
    }
    output += (0, textNormalizer_js_1.escapeXml)(normalizedText.slice(lastIndex));
    return output;
}
function buildSsml(text, voiceName, bcp47Locale, normalizedLocale) {
    const p = PROSODY[normalizedLocale] ?? DEFAULT_PROSODY;
    const attrs = [p.rate ? `rate='${p.rate}'` : '', p.pitch ? `pitch='${p.pitch}'` : '']
        .filter(Boolean).join(' ');
    return `<speak version='1.0' xml:lang='${bcp47Locale}'><voice xml:lang='${bcp47Locale}' name='${voiceName}'><prosody ${attrs}>${buildSsmlText(text, normalizedLocale)}</prosody></voice></speak>`;
}
async function synthesize(text, locale, outputFormat) {
    const key = (process.env.SPEECH_KEY || '').trim();
    const region = (process.env.SPEECH_REGION || '').trim().toLowerCase();
    if (!key || !region)
        throw new Error('SPEECH_KEY or SPEECH_REGION missing');
    const normalizedLocale = normalizeLocale(locale);
    const bcp47Locale = toBcp47(normalizedLocale);
    const voiceName = resolveVoice(locale);
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat = outputFormat;
    // Don't fire sentence-boundary events — reduces per-chunk overhead
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, 'false');
    // null AudioConfig → in-memory buffer, no disk I/O
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
    const ssml = buildSsml(text, voiceName, bcp47Locale, normalizedLocale);
    return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(ssml, (result) => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                resolve(new Uint8Array(result.audioData));
            }
            else {
                reject(new Error(result.errorDetails || 'Synthesis failed'));
            }
        }, (error) => { synthesizer.close(); reject(new Error(String(error))); });
    });
}
function generateSineFallback(durationSec = 1, sampleRate = 8000, freq = 440) {
    const MU = 255;
    const len = Math.floor(durationSec * sampleRate);
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const s = Math.sin(2 * Math.PI * freq * (i / sampleRate));
        const m = Math.min(1, Math.abs(s));
        const sign = s < 0 ? 0x80 : 0;
        out[i] = (sign | Math.round(Math.log(1 + MU * m) / Math.log(1 + MU) * 0x7F)) & 0xFF;
    }
    return out;
}
// Thin wrapper exported for the /api/twilio/stream WSS bridge
async function synthesizeSpeechStream(inputText, locale) {
    return exports.voiceService.generateAudio(inputText, { format: 'mulaw', language: locale });
}
exports.voiceService = {
    async generateAudio(text, options) {
        const allowFallback = options?.allowFallback ?? true;
        const inputText = text.trim();
        if (!inputText) {
            if (!allowFallback)
                throw new Error('Text is empty');
            return generateSineFallback();
        }
        const outputFormat = (options?.format ?? 'mulaw') === 'wav'
            ? sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm // browser playback
            : sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw; // Twilio <Play>
        try {
            return await synthesize(inputText, options?.language ?? 'en-ZA', outputFormat);
        }
        catch (error) {
            const msg = String(error?.message || error);
            console.error(`⚠️ Speech synthesis failed [${options?.language ?? 'en-ZA'}]: ${msg}`);
            if (!allowFallback)
                throw new Error(msg);
            return generateSineFallback();
        }
    }
};
