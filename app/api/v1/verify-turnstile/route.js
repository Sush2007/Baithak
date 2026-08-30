import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing Turnstile token' }, { status: 400 });
    }

    const secretKey = '0x4AAAAAAEfUxjpT5SrVUfljvxUN0tY9P5s'; // From user provided secret

    // Verify the token with Cloudflare Turnstile API
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json();

    if (outcome.success) {
      return NextResponse.json({ success: true, message: 'Turnstile verification successful' }, { status: 200 });
    } else {
      console.error('Turnstile verification failed:', outcome['error-codes']);
      return NextResponse.json(
        { success: false, error: 'Captcha verification failed', codes: outcome['error-codes'] },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return NextResponse.json({ error: 'Internal server error during captcha verification' }, { status: 500 });
  }
}
