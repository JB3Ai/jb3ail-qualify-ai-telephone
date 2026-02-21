import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import 'dotenv/config';

// 1. Map "Short Codes" to Real Azure Voices
const VOICE_MAP: Record<string, string> = {
  'en': 'en-ZA-LeahNeural',   // English (Female)
  'af': 'af-ZA-AdriNeural',   // Afrikaans (Female)
  'zu': 'zu-ZA-ThandoNeural', // Zulu (Female)
  'xh': 'xh-ZA-ThembaNeural', // Xhosa (Male)
  'nso': 'nso-ZA-PhahleMaleNeural' // Northern Sotho/Sepedi (Male)
};

export const voiceService = {
  async generateAudio(text: string, languageCode: string = 'en'): Promise<Uint8Array> {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY || process.env.SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION || process.env.SPEECH_REGION!
    );

    // 2. Select the correct voice based on language
    const selectedVoice = VOICE_MAP[languageCode] || VOICE_MAP['en'];
    speechConfig.speechSynthesisVoiceName = selectedVoice;

    // 3. Use WAV format (Safest for Browser & Phone)
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(text, (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(new Uint8Array(result.audioData));
        } else {
          reject(result.errorDetails);
        }
        synthesizer.close();
      },
        (error) => {
          synthesizer.close();
          reject(error);
        });
    });
  }
};