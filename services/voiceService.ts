import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export const voiceService = {
  async generateAudio(text: string): Promise<Uint8Array> {
    // 1. Setup the Azure Config
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY!, 
      process.env.SPEECH_REGION!
    );
    
    // 2. Select the South African Voice (Zandi)
    speechConfig.speechSynthesisVoiceName = "en-ZA-LeahNeural"; 

    // 3. CRITICAL: Set format to 8kHz u-law (Twilio standard)
    // This prevents the static/silence issues
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // 4. Generate the Audio
    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Use Uint8Array for browser runtime compatibility
            resolve(new Uint8Array(result.audioData));
          } else {
            console.error("Speech Synthesis Failed:", result.errorDetails);
            reject(result.errorDetails);
          }
          synthesizer.close();
        },
        (error) => {
          console.error("Speech Synthesis Error:", error);
          synthesizer.close();
          reject(error);
        }
      );
    });
  }
};