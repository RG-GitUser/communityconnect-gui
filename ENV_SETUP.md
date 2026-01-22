# Environment Setup (Local Dev)

This app uses Firebase Admin on the server (Next.js `app/api/*` routes). If you see:

> Firebase Admin configuration missing...

it means you need to configure credentials for local development.

## Quick start

1. Copy `ENV.example` → `.env.local`
2. Fill in:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Where to get these values

In the Firebase Console:

- **Project Settings** → **Service accounts** → **Generate new private key**
- Download the JSON file and copy:
  - `project_id` → `FIREBASE_PROJECT_ID`
  - `client_email` → `FIREBASE_CLIENT_EMAIL`
  - `private_key` → `FIREBASE_PRIVATE_KEY`

## Private key formatting (important)

Put the key in quotes and keep the `\n` escapes:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The server normalizes this by converting `\\n` into real newlines at runtime.

## If you still get “Invalid PEM formatted message”

That almost always means the key got corrupted by `.env` formatting (extra quotes, missing BEGIN/END lines, or accidental real newlines).

The most reliable option is to use base64:

1. Copy the full PEM from the Firebase service account JSON’s `private_key` (including the BEGIN/END lines).
2. Base64 encode it and set:

```env
FIREBASE_PRIVATE_KEY_BASE64=...
```

and remove/empty `FIREBASE_PRIVATE_KEY`.



