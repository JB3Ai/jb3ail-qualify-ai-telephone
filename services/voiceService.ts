import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

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
  async generateAudio(text: string): Promise<Uint8Array> {
    if (!process.env.SPEECH_KEY || !process.env.SPEECH_REGION) {
      console.warn('⚠️ SPEECH_KEY or SPEECH_REGION missing, returning fallback tone');
      return generateSineFallback();
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY!, 
      process.env.SPEECH_REGION!
    );
    
    speechConfig.speechSynthesisVoiceName = "en-ZA-LeahNeural"; 
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(new Uint8Array(result.audioData));
          } else {
            console.error("Speech Synthesis Failed:", result.errorDetails);
            // fallback to tone rather than rejecting
            resolve(generateSineFallback());
          }
          synthesizer.close();
        },
        (error) => {
          console.error("Speech Synthesis Error:", error);
          synthesizer.close();
          // Provide a fallback sine wave so callers still get audio
          resolve(generateSineFallback());
        }
      );
    });
  }
};
