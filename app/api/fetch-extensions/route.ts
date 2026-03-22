import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  // Extract identifier from URL, e.g., https://archive.org/details/identifier
  const match = url.match(/archive\.org\/details\/([^/?]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  const identifier = match[1];

  try {
    const response = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
    const data = await response.json();
    const files = data.files || [];
    const extensions = [...new Set(files.map((file: any) => {
      const name = file.name;
      const ext = name.split('.').pop();
      return ext ? `.${ext}` : '';
    }).filter((ext: string) => ext))];

    const extensionCounts = extensions.reduce<Record<string, number>>((acc, ext) => {
      const key = String(ext);
      acc[key] = files.filter((file: any) => file.name.endsWith(key)).length;
      return acc;
    }, {});

    const fileList = files.map((file: any) => ({
      name: file.name,
      size: file.size,
      url: `https://archive.org/download/${identifier}/${file.name}`,
    }));

    return NextResponse.json({ extensions, extensionCounts, files: fileList });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}