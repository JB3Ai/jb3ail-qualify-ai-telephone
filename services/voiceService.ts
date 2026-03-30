import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { escapeXml, normalizeBrandText, normalizeScript } from '../utils/textNormalizer.js';

// === THE VIRTUAL CALL CENTER: AZURE VOICE MATRIX ===
// Supports both human-readable labels and the BCP-47 locales the frontend actually sends.
const VOICE_MATRIX: Record<string, string> = {
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
  'french': 'fr-FR-DeniseNeural',
  'fr-fr': 'fr-FR-DeniseNeural',
  'denise': 'fr-FR-DeniseNeural',
  'default': 'en-ZA-LeahNeural',
};

// Per-language SSML prosody — zero latency, prevents Azure hyper-articulation on Nguni voices
const PROSODY: Record<string, { rate: string; pitch?: string }> = {
  'en-za':  { rate: '-2%' },
  'xh-za':  { pitch: '-10%', rate: '-5%' },
  'zu-za':  { pitch: '-8%',  rate: '-6%' },   // increased pitch drop — ThembaNeural sounds Jamaican at default
  'nso-za': { pitch: '-18%', rate: '-7%' },
  'af-za':  { rate: '-3%' },
  'pt-pt':  { rate: '-8%' },
  'pt-br':  { rate: '-8%' },
  'el-gr':  { rate: '-4%' },
  'zh-cn':  { rate: '-2%' },
  'fr-fr':  { rate: '-5%' },
};

// Fallback voices for languages whose primary Neural voice is unavailable in southafricanorth.
// Azure Cognitive Services regional availability: xh-ZA and nso-ZA voices may not be deployed
// in southafricanorth — fall through to en-ZA-LeahNeural with the original text still in target language.
const VOICE_FALLBACK: Record<string, string> = {
  'xh-za':  'en-ZA-LeahNeural',
  'nso-za': 'en-ZA-LeahNeural',
};
const DEFAULT_PROSODY: { rate: string; pitch?: string } = { rate: '-3%' };
const PHONETIC_BREAK_LOCALES = new Set(['nso-za', 'zh-cn']);
const TECHNICAL_TERM_PATTERN = /\b(Solar|Battery|Inverter|Eskom)\b([,:;]?)/gi;

function normalizeLocale(locale?: string): string {
  return (locale || '').trim().toLowerCase();
}

function toBcp47(normalized: string): string {
  const [lang, region] = normalized.split('-');
  if (lang && region) return `${lang}-${region.toUpperCase()}`;
  return normalized || 'en-ZA';
}

function resolveVoice(locale?: string): string {
  const normalized = normalizeLocale(locale);
  return VOICE_MATRIX[normalized] ?? VOICE_MATRIX['default'];
}

function buildSsmlText(text: string, normalizedLocale: string): string {
  const normalizedText = normalizeBrandText(text);
  if (!PHONETIC_BREAK_LOCALES.has(normalizedLocale)) {
    return normalizeScript(normalizedText);
  }

  let output = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TECHNICAL_TERM_PATTERN.lastIndex = 0;

  while ((match = TECHNICAL_TERM_PATTERN.exec(normalizedText)) !== null) {
    output += escapeXml(normalizedText.slice(lastIndex, match.index));
    output += `${escapeXml(match[1])}${escapeXml(match[2] || '')}<break time='200ms'/>`;
    lastIndex = match.index + match[0].length;
  }

  output += escapeXml(normalizedText.slice(lastIndex));
  return output;
}

function buildSsml(text: string, voiceName: string, bcp47Locale: string, normalizedLocale: string): string {
  const p = PROSODY[normalizedLocale] ?? DEFAULT_PROSODY;
  const attrs = [p.rate ? `rate='${p.rate}'` : '', p.pitch ? `pitch='${p.pitch}'` : '']
    .filter(Boolean).join(' ');
  return `<speak version='1.0' xml:lang='${bcp47Locale}'><voice xml:lang='${bcp47Locale}' name='${voiceName}'><prosody ${attrs}>${buildSsmlText(text, normalizedLocale)}</prosody></voice></speak>`;
}

async function synthesize(text: string, locale: string, outputFormat: sdk.SpeechSynthesisOutputFormat, voiceOverride?: string): Promise<Uint8Array> {
  const key    = (process.env.SPEECH_KEY    || '').trim();
  const region = (process.env.SPEECH_REGION || '').trim().toLowerCase();
  if (!key || !region) throw new Error('SPEECH_KEY or SPEECH_REGION missing');

  const normalizedLocale = normalizeLocale(locale);
  const bcp47Locale      = toBcp47(normalizedLocale);
  const voiceName        = voiceOverride ?? resolveVoice(locale);

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName    = voiceName;
  speechConfig.speechSynthesisOutputFormat = outputFormat;
  // Don't fire sentence-boundary events — reduces per-chunk overhead
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, 'false');

  // null AudioConfig → in-memory buffer, no disk I/O
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as any);
  const ssml = buildSsml(text, voiceName, bcp47Locale, normalizedLocale);

  return new Promise<Uint8Array>((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const raw = new Uint8Array(result.audioData);
          // Prepend 150 ms of silence to WAV so browser decoder startup
          // consumes silence rather than clipping the first syllable.
          const out = outputFormat === sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm
            ? prependSilenceToWav(raw, 150)
            : raw;
          resolve(out);
        } else {
          reject(new Error(result.errorDetails || 'Synthesis failed'));
        }
      },
      (error) => { synthesizer.close(); reject(new Error(String(error))); }
    );
  });
}

/**
 * Prepend silence to a Riff16Khz16BitMonoPcm WAV buffer so that browser audio
 * decoder startup latency consumes silence rather than clipping the first
 * syllable of speech (~0.2 s clip reported on 80% of responses).
 */
function prependSilenceToWav(wavBuffer: Uint8Array, silenceMs: number): Uint8Array {
  const HEADER_SIZE = 44;
  if (wavBuffer.length < HEADER_SIZE) return wavBuffer;

  // Riff16Khz16BitMonoPcm: 16 kHz, 16-bit, mono
  const SAMPLE_RATE = 16000;
  const BYTES_PER_SAMPLE = 2;
  const silenceBytes = Math.floor(SAMPLE_RATE * silenceMs / 1000) * BYTES_PER_SAMPLE;

  const newPcmSize = silenceBytes + (wavBuffer.length - HEADER_SIZE);
  const result = new Uint8Array(HEADER_SIZE + newPcmSize);
  const view = new DataView(result.buffer);

  // Copy original header, then patch the two size fields
  result.set(wavBuffer.slice(0, HEADER_SIZE), 0);
  view.setUint32(4,  HEADER_SIZE + newPcmSize - 8, true);  // RIFF chunk size
  view.setUint32(40, newPcmSize, true);                     // data chunk size

  // Silence is already zero-initialised; copy original PCM after it
  result.set(wavBuffer.slice(HEADER_SIZE), HEADER_SIZE + silenceBytes);
  return result;
}

function generateSineFallback(durationSec = 1, sampleRate = 8000, freq = 440): Uint8Array {
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
export async function synthesizeSpeechStream(inputText: string, locale: string): Promise<Uint8Array> {
  return voiceService.generateAudio(inputText, { format: 'mulaw', language: locale });
}

export const voiceService = {
  async generateAudio(
    text: string,
    options?: { allowFallback?: boolean; format?: 'mulaw' | 'wav'; language?: string }
  ): Promise<Uint8Array> {
    const allowFallback = options?.allowFallback ?? true;
    const inputText = text.trim();

    if (!inputText) {
      if (!allowFallback) throw new Error('Text is empty');
      return generateSineFallback();
    }

    const outputFormat = (options?.format ?? 'mulaw') === 'wav'
      ? sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm   // browser playback
      : sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;   // Twilio <Play>

    const primaryLocale = normalizeLocale(options?.language ?? 'en-ZA');
    try {
      return await synthesize(inputText, options?.language ?? 'en-ZA', outputFormat);
    } catch (error: any) {
      const msg = String(error?.message || error);
      console.error(`⚠️ Speech synthesis failed [${primaryLocale}]: ${msg}`);
      if (!allowFallback) throw new Error(msg);

      // Retry with regional fallback voice if available (e.g. xh-ZA/nso-ZA not in southafricanorth)
      const fallbackVoice = VOICE_FALLBACK[primaryLocale];
      if (fallbackVoice) {
        console.warn(`⚠️ Retrying with fallback voice ${fallbackVoice} for locale ${primaryLocale}`);
        try {
          return await synthesize(inputText, 'en-ZA', outputFormat, fallbackVoice);
        } catch (fallbackErr: any) {
          console.error(`⚠️ Fallback voice also failed: ${String(fallbackErr?.message || fallbackErr)}`);
        }
      }

      return generateSineFallback();
    }
  }
};
