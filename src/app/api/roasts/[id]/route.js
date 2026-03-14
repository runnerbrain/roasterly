import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Roast from '@/models/Roast';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    const { cuppingNotes, beanId, title } = body;

    // Handle string to array migration - ignore existing string value if it was saved via older model
    const roast = await Roast.findById(id).lean();
    if (!roast) return NextResponse.json({ error: 'Roast not found' }, { status: 404 });

    const updatePayload = {};

    if (cuppingNotes !== undefined) {
      const isArray = Array.isArray(cuppingNotes);
      updatePayload.cuppingNotes = isArray ? cuppingNotes : [];
    }

    if (beanId !== undefined) {
      updatePayload.beanId = beanId;
    }

    if (title !== undefined) {
      updatePayload.title = title;
    }

    const updatedRoast = await Roast.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(updatedRoast, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PATCH /api/roasts error:', error);
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update roast' },
      { status: 500 }
    );
  }
}
