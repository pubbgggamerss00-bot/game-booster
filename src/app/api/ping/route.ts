import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Minimal same-origin endpoint for REAL RTT (ping) measurement.
 * The browser measures fetch round-trip time against this route.
 */
export async function GET() {
  return NextResponse.json(
    { t: Date.now(), ok: true },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
