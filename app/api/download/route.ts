import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  const { url, selectedExtensions } = await request.json();

  const match = url.match(/archive\.org\/details\/([^/?]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  const identifier = match[1];

  const metaResponse = await fetch(`https://archive.org/metadata/${identifier}`);
  if (!metaResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }

  const data = await metaResponse.json();
  const files: { name: string }[] = (data.files || []).filter((file: any) => {
    const ext = '.' + file.name.split('.').pop();
    return selectedExtensions.includes(ext);
  });

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files found with selected extensions' }, { status: 400 });
  }

  // Download all files in parallel
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const fileUrl = `https://archive.org/download/${identifier}/${file.name}`;
        const res = await fetch(fileUrl);
        if (!res.ok) return null;
        const buffer = Buffer.from(await res.arrayBuffer());
        return { name: file.name, buffer };
      } catch {
        return null;
      }
    })
  );

  // Build ZIP (level 0 = store, no CPU wasted on compression)
  const archive = archiver('zip', { zlib: { level: 0 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  for (const result of results) {
    if (result) {
      archive.append(Readable.from(result.buffer), { name: result.name });
    }
  }

  await archive.finalize();

  const zipBuffer = Buffer.concat(chunks);

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${identifier}.zip"`,
    },
  });
}
