import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export const voiceService = {
  async generateAudio(text: string): Promise<Uint8Array> {
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
