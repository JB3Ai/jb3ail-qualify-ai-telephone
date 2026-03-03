#!/bin/bash

# --- CONFIGURATION ---
APP_NAME="os3grid-neural-hub"       # Must be globally unique in Azure
RESOURCE_GROUP="os3gridnew"         # Using your existing group
LOCATION="southafricanorth"         # Local South Africa region
SKU="B1"                            # Basic tier (supports custom domains/SSL)

echo "🚀 Initiating JB³Ai Neural Hub Deployment..."

# 1. Login (uncomment if running for the first time)
# az login

# 2. Deploy/Update the Web App
# This command zips the folder and enables build automation (npm install)
az webapp up \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku "$SKU" \
  --runtime "NODE|20-lts"

# 3. Inject Environment Variables (Connectivity Matrix)
echo "📡 Configuring Neural Connectivity Matrix..."
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    AZURE_OPENAI_API_KEY="DpblOdq6uv9YZO6dlb0C7KgHFPYlZsEcXMbcMhQuS9n449dW7ApbJQQJ99CCACrIdLPXJ3w3AAABACOGVK4Q" \
    AZURE_OPENAI_ENDPOINT="https://os3grid.openai.azure.com/" \
    AZURE_OPENAI_DEPLOYMENT="OpenAICreate-20260303131401" \
    SPEECH_KEY="35d1Bs766pT11t3W79tvFgU2wF5DyoB36IZ4TiyegYESCnpv9W48JQQJ99CAACrIdLPXJ3w3AAAYACOGwac4" \
    SPEECH_REGION="southafricanorth" \
    TWILIO_ACCOUNT_SID="ACee2273219792b3a758e8af6cafceb01c" \
    TWILIO_AUTH_TOKEN="fe710ed33ccdf09737f9c733e05b75c2" \
    TWILIO_PHONE_NUMBER="+12187572540" \
    GEMINI_API_KEY="AIzaSyBIhHvQ8opmbWUtV8sa7Oov3FhQjXeFZP8" \
    DOMAIN="$APP_NAME.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

echo "✅ Deployment Complete! Neural Link Live at: https://$APP_NAME.azurewebsites.net"
