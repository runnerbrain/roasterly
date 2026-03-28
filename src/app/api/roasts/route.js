import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Roast from '@/models/Roast';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const roasts = await Roast.find({}).sort({ roastDate: -1 }).lean();
    return NextResponse.json(roasts, { status: 200, headers: { 'Cache-Control': 'no-store','CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store'} });
  } catch (error) {
    console.error('GET /api/roasts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roasts' },
      { status: 500 }
    );
  }
}
