import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⚡ OPTIMIZATION 3: Configure model for speed
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig: {
    maxOutputTokens: 60, // Limit response length (faster generation)
    temperature: 0.7,    // Slightly creative, but focused
  }
});

export const geminiService = {
  async generateResponse(input: string): Promise<string> {
    try {
      // ⚡ OPTIMIZATION 4: The "Zandi Protocol" (Anti-Gravity Voice Tone)
      const SYSTEM_PROMPT = `
        Identity: JB³Ai Neural Core // Zandi Protocol.
        Voice: Founder-Engineer, Tactical, Direct.
        
        RULES:
        - No fluff. No "How can I help you".
        - Use: "Systems beat effort" and "Automation is the new workforce".
        - Structure: Problem → System → Outcome.
        
        MISSION: Identify lead signal. If no signal, terminate call.

        User said: "${input}"
      `;

      const result = await model.generateContent(SYSTEM_PROMPT);
      const response = await result.response;
      let text = response.text();

      // Cleanup: Remove asterisks or formatting that messes up TTS
      return text.replace(/[*#]/g, '').trim();

    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm having a little trouble hearing you. Could you say that again?";
    }
  }
};