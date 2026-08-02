import { NextResponse } from 'next/server';
import { getLinkPreview } from 'link-preview-js';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const preview = await getLinkPreview(url, {
      followRedirects: 'follow',
      headers: {
        'User-Agent': 'WhatsApp/2.21.12.21 A'
      }
    });

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
