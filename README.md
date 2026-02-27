<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/97b5dd36-eccc-42c6-a473-03aee547a478

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Architecture notes

- **Azure AI gateways**: When deploying or extending AI/telephony, consider routing through [Azure AI Gateway](https://learn.microsoft.com/en-us/azure/ai-services/ai-gateway/) (or equivalent) for unified routing, rate limits, and observability alongside existing Azure Speech and Gemini usage.
