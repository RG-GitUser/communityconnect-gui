import { NextResponse } from 'next/server';

// Respond to browsers that request `/favicon.ico` to avoid noisy 404s in dev.
// We return an SVG (text) so we don't need to commit a binary .ico file.
export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#b3e8f0"/>
  <text x="32" y="41" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="28" font-weight="700" fill="#1e3a8a">CC</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Don’t cache aggressively in dev; Next will handle prod caching.
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}





