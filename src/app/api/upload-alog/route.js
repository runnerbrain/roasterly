import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Roast from '@/models/Roast';
import { pythonDictToJson, mapAlogToRoast } from '@/lib/alogParser';

export async function POST(req) {
  console.log('[Upload API] upload route hit');
  try {
    await connectDB();
    const formData = await req.formData();
    console.log('[Upload API] formData parsed');
    const files = formData.getAll('files');
    console.log(`[Upload API] Received ${files.length} parts in formData for 'files'`);
    const results = [];

    for (const file of files) {
      console.log('[Upload API] file:', file?.name, file?.size);
      if (typeof file === 'string') {
        console.log(`[Upload API] Skipping string part`);
        continue;
      }

      const filename = file.name;
      console.log(`\n[Upload API] ===== Starting processing for file: ${filename} =====`);
      try {
        const text = await file.text();
        console.log(`[Upload API] File text read, length: ${text.length}`);
        
        const jsonStr = pythonDictToJson(text);
        console.log(`[Upload API] pythonDictToJson completed. Output string length: ${jsonStr.length}`);
        if (jsonStr.length < 500) console.log(`[Upload API] jsonStr preview: ${jsonStr.substring(0, 500)}`);
        
        const parsed = JSON.parse(jsonStr);
        console.log(`[Upload API] JSON.parse completed. Keys: ${Object.keys(parsed).join(', ')}`);
        
        const data = mapAlogToRoast(parsed);
        console.log(`[Upload API] mapAlogToRoast completed. Output data keys: ${Object.keys(data).join(', ')}`);
        console.log(`[Upload API] Extracted roastUUID: ${data.roastUUID}`);

        if (!data.roastUUID) {
          console.log(`[Upload API] Skipping - No roastUUID found for ${filename}. Title: ${data.title}`);
          results.push({ filename, status: 'skipped', title: data.title || 'Unknown' });
          continue;
        }

        console.log(`[Upload API] Looking up/Upserting Roast by UUID: ${data.roastUUID}`);
        const doc = await Roast.findOneAndUpdate(
          { roastUUID: data.roastUUID },
          { $set: data },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
        );
        console.log(`[Upload API] db operation completed. Doc title: ${doc.title}`);

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
    console.error('[Upload API] upload route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}