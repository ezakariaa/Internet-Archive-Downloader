import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get('fileUrl');
  if (!fileUrl) {
    return NextResponse.json({ error: 'Missing fileUrl query parameter' }, { status: 400 });
  }

  try {
    const validated = new URL(fileUrl);
    if (!validated.hostname.endsWith('archive.org')) {
      return NextResponse.json({ error: 'Only archive.org resources are allowed' }, { status: 400 });
    }

    const sourceResponse = await fetch(fileUrl);
    if (!sourceResponse.ok) {
      return NextResponse.json({ error: `Remote fetch failed: ${sourceResponse.status}` }, { status: sourceResponse.status });
    }

    const headers = new Headers(sourceResponse.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    if (!headers.has('content-disposition')) {
      const name = validated.pathname.split('/').pop() || 'download';
      headers.set('Content-Disposition', `attachment; filename="${name}"`);
    }

    return new NextResponse(sourceResponse.body, {
      status: sourceResponse.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error', error);
    return NextResponse.json({ error: 'Proxy server error' }, { status: 500 });
  }
}