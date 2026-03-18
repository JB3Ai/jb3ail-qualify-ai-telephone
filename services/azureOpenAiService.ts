import { OpenAI } from "openai";
import * as appInsights from 'applicationinsights';
// defaultClient is null unless appInsights.setup() was called first
const telemetryClient = appInsights.defaultClient ?? null;

export class AzureOpenAiService {
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || ''}`,
        defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! }
      });
    }
    return this._client;
  }

  /**
   * Execute a signal through the Neural Protocol.
   * Wraps the system prompt in XML protocol indicators (matching the C# NeuralProtocolController pattern).
   */
  async generateResponse(userText: string, protocolSection?: string): Promise<string> {
    const startTime = Date.now();

    const systemPrompt = protocolSection
      ? `<protocol_context>\n${protocolSection}\n</protocol_context>\n\n<contract>\nRespond in clear, professional prosody under three concise sentences.\nIf the interaction is complete, append the JSON output contract specified in the protocol.\n</contract>`
      : "You are Zandi, a professional qualification agent for Mzansi Solutions.";

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      telemetryClient?.trackMetric({ name: "AI_Logic_Latency", value: Date.now() - startTime });
      return response.choices[0].message.content || "";
    } catch (error) {
      telemetryClient?.trackException({ exception: error as Error });
      throw error;
    }
  }

  /**
   * Stream tokens from Azure OpenAI for ultra-low-latency voice.
   * Yields individual tokens as they arrive from the LLM.
   */
  async *streamResponse(userText: string, protocolSection?: string): AsyncGenerator<string> {
    const systemPrompt = protocolSection
      ? `<protocol_context>\n${protocolSection}\n</protocol_context>\n\n<contract>\nRespond in clear, professional prosody under three concise sentences.\nIf the interaction is complete, append the JSON output contract specified in the protocol.\n</contract>`
      : "You are Zandi, a professional qualification agent for Mzansi Solutions.";

    const stream = await this.client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      max_tokens: 150,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
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
