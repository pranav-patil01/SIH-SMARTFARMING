import { NextResponse } from 'next/server';

/**
 * Mock endpoint for ingesting real field telemetry or MQTT bridge feeds.
 * POST /api/telemetry
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      receivedAt: new Date().toISOString(),
      status: 'Telemetry frame ingested into AgriSense cloud pipeline',
      frame: body,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AgriSense Real-time Telemetry Ingestion API',
    status: 'ONLINE',
    supportedProtocols: ['HTTP/JSON', 'MQTT Bridge via WebSockets'],
    version: '1.0.0',
  });
}
