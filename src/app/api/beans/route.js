import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GreenBean from '@/models/GreenBean';

export async function GET() {
  try {
    await connectDB();
    const beans = await GreenBean.find().sort({ purchaseDate: -1 }).lean();
    return NextResponse.json(beans, { status: 200 });
  } catch (error) {
    console.error('GET /api/beans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch green beans' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { country, region, process, purchaseDate, totalWeight } = body;

const newBean = await GreenBean.create({
  country,
  region,
  process,
  purchaseDate,
  totalWeight,
});

    return NextResponse.json(newBean, { status: 201 });
  } catch (error) {
    console.error('POST /api/beans error:', error);
    return NextResponse.json(
      { error: 'Failed to create green bean record' },
      { status: 500 }
    );
  }
}
