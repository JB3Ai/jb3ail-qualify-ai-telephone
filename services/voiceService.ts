import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import axios from 'axios';

const DEFAULT_VOICE_NAME = 'en-ZA-LeahNeural';
const VOICE_CANDIDATES_BY_LANGUAGE: Record<string, string[]> = {
  'en-za': ['en-ZA-LeahNeural', 'en-ZA-LukeNeural', 'en-GB-SoniaNeural', 'en-US-AvaMultilingualNeural'],
  'zu-za': ['zu-ZA-ThandoNeural', 'en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-ZA-LeahNeural'],
  'xh-za': ['xh-ZA-ThandoNeural', 'xh-ZA-AyandaNeural', 'en-US-AvaMultilingualNeural', 'en-ZA-LeahNeural'],
  'af-za': ['af-ZA-AdriNeural', 'af-ZA-WillemNeural', 'en-ZA-LeahNeural'],
  'nso-za': ['zu-ZA-ThandoNeural', 'en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-ZA-LeahNeural'],
  'pt-pt': ['pt-PT-RaquelNeural', 'pt-PT-DuarteNeural', 'en-US-AvaMultilingualNeural'],
  'el-gr': ['el-GR-AthinaNeural', 'el-GR-NestorasNeural', 'en-US-AvaMultilingualNeural'],
  'zh-cn': ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'en-US-AvaMultilingualNeural'],
};

const PRONUNCIATION_ALIASES_BY_LANGUAGE: Record<string, Array<{ term: string; alias: string }>> = {
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

// Per-language SSML prosody overrides — "Ubuntu Resonance" profile.
// pitch:   lowers fundamental frequency for chest-voice authenticity in Nguni languages
// contour: models the tonal arc of flowing speech (rise-sustain-fall) to prevent clipping
// rate:    slight reduction prevents hyper-articulation common in Azure neural defaults
type ProsodyConfig = { rate: string; pitch?: string; contour?: string };

// Nguni contour: flat open → slight dip → gentle rise → natural close
const NGUNI_CONTOUR = '(0%, +0Hz) (20%, -2Hz) (80%, +1Hz) (100%, -3Hz)';

const PROSODY_BY_LANGUAGE: Record<string, ProsodyConfig> = {
  'xh-za':  { pitch: '-12%', rate: '-5%', contour: NGUNI_CONTOUR }, // Xhosa: deepest Ubuntu Resonance
  'zu-za':  { pitch: '-5%',  rate: '-5%', contour: NGUNI_CONTOUR }, // Zulu: Hlonipha tonal profile
  'nso-za': { rate: '-5%',  contour: NGUNI_CONTOUR },               // Sepedi: softer Nguni arc
  'af-za':  { rate: '-5%' },                                        // Afrikaans: friendly cadence, no tonal arc
};
const DEFAULT_PROSODY: ProsodyConfig = { rate: '-3%' };

function normalizeLanguage(language?: string): string {
  return (language || '').trim().toLowerCase();
}

function resolveVoiceCandidates(language?: string): string[] {
  const normalized = normalizeLanguage(language);
  const candidates = VOICE_CANDIDATES_BY_LANGUAGE[normalized] || [DEFAULT_VOICE_NAME];
  return Array.from(new Set([...candidates, DEFAULT_VOICE_NAME]));
}

function resolveLocale(language?: string): string {
  const normalized = normalizeLanguage(language);
  return normalized || 'en-ZA';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSsmlText(text: string, language?: string): string {
  const normalized = normalizeLanguage(language);
  const aliases = PRONUNCIATION_ALIASES_BY_LANGUAGE[normalized] || [];
  if (!aliases.length) {
    return escapeXml(text);
  }

  let withTokens = text;
  const tokenMappings: Array<{ token: string; term: string; alias: string }> = [];

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

function buildSsmlDocument(text: string, locale: string, voiceName: string, language?: string): string {
  const body = buildSsmlText(text, language);
  const prosody = PROSODY_BY_LANGUAGE[normalizeLanguage(language)] ?? DEFAULT_PROSODY;
  const prosodyAttrs = [
    prosody.rate    ? `rate='${prosody.rate}'`         : '',
    prosody.pitch   ? `pitch='${prosody.pitch}'`       : '',
    prosody.contour ? `contour="${prosody.contour}"` : '',
  ].filter(Boolean).join(' ');
  return `<speak version='1.0' xml:lang='${locale}'><voice xml:lang='${locale}' name='${voiceName}'><prosody ${prosodyAttrs}>${body}</prosody></voice></speak>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function synthesizeWavViaRest(text: string, key: string, region: string, voiceName: string, locale: string, language?: string): Promise<Uint8Array> {
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = buildSsmlDocument(text, locale, voiceName, language);

  const response = await axios.post<ArrayBuffer>(endpoint, ssml, {
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

async function synthesizeMuLawViaSdk(text: string, key: string, region: string, voiceName: string, locale: string, language?: string): Promise<Uint8Array> {
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;
  // Allow longer silence before cutting off — critical for Xhosa/Zulu mid-sentence pauses
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, '5000');
  // Allow postback latency headroom for Zulu tonal pauses
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_PostbackTimeoutMs, '1200');
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
  const ssml = buildSsmlDocument(text, locale, voiceName, language);

  return new Promise((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(new Uint8Array(result.audioData));
        } else {
          reject(new Error(result.errorDetails || 'Speech synthesis failed'));
        }
        synthesizer.close();
      },
      (error) => {
        synthesizer.close();
        reject(new Error(String(error)));
      }
    );
  });
}

// helper: simple mu-law encoder (input sample in [-1,1])
function linearToMuLaw(sample: number): number {
  const MU = 255;
  const sign = sample < 0 ? 1 : 0;
  let magnitude = Math.min(1, Math.abs(sample));
  const muLawSample = sign * 0x80 | (Math.log(1 + MU * magnitude) / Math.log(1 + MU) * 0x7F);
  return muLawSample & 0xFF;
}

// generate a sine wave fallback in mu-law format
function generateSineFallback(durationSeconds = 1, sampleRate = 8000, freq = 440): Uint8Array {
  const length = Math.floor(durationSeconds * sampleRate);
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t);
    out[i] = linearToMuLaw(sample);
  }
  return out;
}

export const voiceService = {
  async generateAudio(text: string, options?: { allowFallback?: boolean; format?: 'mulaw' | 'wav'; language?: string }): Promise<Uint8Array> {
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
          return await synthesizeWavViaRest(inputText, speechKey, speechRegion, voiceName, locale, options?.language);
        } catch (error: any) {
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
      } catch (error: any) {
        lastSdkMessage = String(error?.message || error || 'Speech synthesis failed');
      }
    }

    if (!allowFallback) {
      throw new Error(lastSdkMessage);
    }

    return generateSineFallback();
  }
};
