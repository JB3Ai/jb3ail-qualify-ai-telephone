import { OpenAI } from "openai";
import * as appInsights from 'applicationinsights';
const telemetryClient = appInsights.defaultClient;

export class AzureOpenAiService {
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        // Standardized v1 path for Azure 2026 integrations
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/v1`,
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! }
      });
    }
    return this._client;
  }

  async generateResponse(userText: string, systemPrompt?: string): Promise<string> {
    const startTime = Date.now();
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "",
        messages: [
          { role: "system", content: systemPrompt || "You are Zandi, a professional qualification agent for Mzansi Solutions." },
          { role: "user", content: userText }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });
      telemetryClient.trackMetric({ name: "AI_Logic_Latency", value: Date.now() - startTime });
      return response.choices[0].message.content || "";
    } catch (error) {
      telemetryClient.trackException({ exception: error as Error });
      throw error;
    }
  }

  async extractLeadData(transcript: string) {
    const response = await this.client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "",
      messages: [
        { role: "system", content: "Analyze the transcript and return a JSON lead object." },
        { role: "user", content: transcript }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  }
}

export const aiService = new AzureOpenAiService();
