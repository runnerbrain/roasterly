import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Roast from '@/models/Roast';
import { pythonDictToJson, mapAlogToRoast } from '@/lib/alogParser';

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const files = formData.getAll('files');
    const results = [];

    for (const file of files) {
      if (typeof file === 'string') continue;

      const filename = file.name;
      try {
        const text = await file.text();
        const jsonStr = pythonDictToJson(text);
        const parsed = JSON.parse(jsonStr);
        const data = mapAlogToRoast(parsed);

        if (!data.roastUUID) {
          results.push({ filename, status: 'skipped', title: data.title || 'Unknown' });
          continue;
        }

        const doc = await Roast.findOneAndUpdate(
          { roastUUID: data.roastUUID },
          { $set: data },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
        );

        const status = new Date(doc.createdAt).getTime() === new Date(doc.updatedAt).getTime()
          ? 'inserted'
          : 'updated';

        results.push({ filename, status, title: doc.title });
      } catch (err) {
        console.error(`Error processing file ${filename}:`, err);
        results.push({ filename, status: 'error', title: 'Unknown' });
      }
    }

    return NextResponse.json({ results }, {
      headers: {
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}