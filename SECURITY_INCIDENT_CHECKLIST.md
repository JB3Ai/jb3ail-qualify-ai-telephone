# Google Key Exposure Checklist

Project: `os3grid-neural-hub`  
Service account: `jono-645@os3grid-neural-hub.iam.gserviceaccount.com`  
Exposed key id: `bfeb425b03a182d3c9f553eb5dba1ec971f57e9b`

## Important

Even if you believe only one user accessed the key, treat the key as compromised.
A public GitHub exposure means the key must be rotated and removed from use.

## 1. Immediate Containment

1. Open Google Cloud Console for `os3grid-neural-hub`.
2. Go to `IAM & Admin` -> `Service Accounts`.
3. Open `jono-645@os3grid-neural-hub.iam.gserviceaccount.com`.
4. Open the `Keys` tab.
5. Disable or delete key `bfeb425b03a182d3c9f553eb5dba1ec971f57e9b`.
6. Review Cloud Logging for any abuse or unexpected usage tied to the alert.

## 2. Decide the Auth Path

This app supports two Google access patterns in [server.ts](./server.ts):

- Primary: `GAS_WEBHOOK_URL`
- Fallback: `GOOGLE_KEY_JSON_DATA`

Recommended:

1. Keep `GAS_WEBHOOK_URL` as the primary path.
2. Only use `GOOGLE_KEY_JSON_DATA` if the service-account fallback is truly required.
3. Do not store a JSON key file in the repo.

## 3. Render Update

1. Open the Render service for this app.
2. Check whether `GAS_WEBHOOK_URL` is configured.
3. If `GAS_WEBHOOK_URL` works, remove any old Google key file dependency.
4. If a service account is still required, create a replacement key and paste the full JSON into `GOOGLE_KEY_JSON_DATA`.
5. Never upload the JSON key into the repo or keep it in the project folder.
6. Run `Manual Deploy` -> `Clear build cache & deploy`.

## 4. Shared Sheet Access

If the sheet is owned by another Google account but shared with this service account:

1. Confirm whether the service account still needs access to that sheet.
2. If yes, keep the service account but replace the key.
3. If no, remove the service account from the shared sheet and use Apps Script only.

## 5. Repo Cleanup

1. Remove any committed key files from the repo.
2. Keep secret filenames ignored in `.gitignore`.
3. Keep `.env.example` as placeholders only.
4. Search before every push:

```powershell
rg -n "private_key|service_account|AIza|TWILIO_AUTH_TOKEN|SPEECH_KEY" -uu .
```

## 6. Rotate Other Exposed Secrets

This repo should also be reviewed for other exposed credentials.
Rotate these if they were real values:

1. Twilio account token
2. Google Gemini API key
3. Azure Speech key

## 7. Verify After Fix

1. Trigger the sync endpoint.
2. Confirm lead import works.
3. Confirm no local JSON key file is being loaded.
4. Confirm Render env vars are the only source of secrets.
5. Confirm GitHub no longer contains active secrets.

## 8. Optional Hardening

1. Remove the Sheets API fallback entirely if Apps Script is enough.
2. Prefer webhook-based or managed identity style access over long-lived JSON keys.
3. Add secret scanning to the repo workflow.
