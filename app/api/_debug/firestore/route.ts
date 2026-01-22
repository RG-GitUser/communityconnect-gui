import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

function serializeError(err: any) {
  return {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    status: err?.status,
    details: err?.details,
  };
}

// Dev-only endpoint that performs a minimal Firestore read to confirm credentials.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const db = getFirebaseAdmin();
    // Minimal read; does not create or modify data.
    await db.collection('_health').limit(1).get();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: serializeError(err),
        hint:
          err?.code === 16 || String(err?.message || '').includes('UNAUTHENTICATED')
            ? 'UNAUTHENTICATED usually means the FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / private key do not all come from the SAME service-account JSON, or the service account lacks Firestore permissions for that project.'
            : undefined,
      },
      { status: 500 }
    );
  }
}




