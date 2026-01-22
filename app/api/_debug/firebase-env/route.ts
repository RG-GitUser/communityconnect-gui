import { NextResponse } from 'next/server';

// Dev-only endpoint to confirm Firebase env vars are visible to the Next.js server.
// Does NOT return secret values (only presence/length).
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? '';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64 ?? '';

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    projectId: projectId || null,
    clientEmail: clientEmail || null,
    hasProjectId: projectId.trim().length > 0,
    hasClientEmail: clientEmail.trim().length > 0,
    hasPrivateKey: privateKey.trim().length > 0,
    hasPrivateKeyBase64: privateKeyBase64.trim().length > 0,
    // Helpful hints without leaking secrets:
    privateKeyLength: privateKey.length,
    privateKeyBase64Length: privateKeyBase64.length,
    privateKeyLooksPem:
      privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY'),
  });
}


