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
exports.aiService = exports.AzureOpenAiService = void 0;
const openai_1 = require("openai");
const appInsights = __importStar(require("applicationinsights"));
// defaultClient is null unless appInsights.setup() was called first
const telemetryClient = appInsights.defaultClient ?? null;
class AzureOpenAiService {
    _client = null;
    get client() {
        if (!this._client) {
            this._client = new openai_1.OpenAI({
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || ''}`,
                defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview' },
                defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
            });
        }
        return this._client;
    }
    /**
     * Execute a signal through the Neural Protocol.
     * Wraps the system prompt in XML protocol indicators (matching the C# NeuralProtocolController pattern).
     */
    async generateResponse(userText, protocolSection) {
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
        }
        catch (error) {
            telemetryClient?.trackException({ exception: error });
            throw error;
        }
    }
    /**
     * Stream tokens from Azure OpenAI for ultra-low-latency voice.
     * Yields individual tokens as they arrive from the LLM.
     */
    async *streamResponse(userText, protocolSection) {
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
            if (token)
                yield token;
        }
    }
    async extractLeadData(transcript) {
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
exports.AzureOpenAiService = AzureOpenAiService;
exports.aiService = new AzureOpenAiService();
