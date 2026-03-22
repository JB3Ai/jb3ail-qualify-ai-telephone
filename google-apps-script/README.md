# Google Apps Script Bridge

Use [`whatsapp-auto-injector.gs`](./whatsapp-auto-injector.gs) to move new rows from `SOURCE_WHATSAPP` into `MZANZI_ENGINE` automatically.

This matches the backend import shape in [server.ts](../server.ts), which reads `MZANZI_ENGINE!A:J`.

## Setup

1. Open the connected Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Create a script file and paste in `whatsapp-auto-injector.gs`.
4. Add an installable `On edit` trigger for `onEdit`.
5. Make sure both sheet tabs exist:
   - `SOURCE_WHATSAPP`
   - `MZANZI_ENGINE`

## Behavior

- Only runs on edits in `SOURCE_WHATSAPP`.
- Ignores the header row.
- Copies columns `A:J` into `MZANZI_ENGINE`.
- Avoids duplicate inserts by checking the existing `name + phone` pair.
