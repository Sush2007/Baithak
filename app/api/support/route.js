import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('email, display_name').eq('id', user.id).single();

    const body = await request.json();
    const { type, message } = body;

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }

    // Customize subject and HTML based on the type to make them distinct
    let subjectPrefix = '';
    let headerColor = '#000000';
    
    if (type === 'Bug Report') {
      subjectPrefix = '🚨 [BUG REPORT]';
      headerColor = '#DC2626'; // Red
    } else if (type === 'Feature Request') {
      subjectPrefix = '💡 [FEATURE REQUEST]';
      headerColor = '#2563EB'; // Blue
    } else {
      subjectPrefix = '📬 [GENERAL SUPPORT]';
      headerColor = '#16A34A'; // Green
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Baithak Support <support@baithakpe.com>',
      to: ['support@baithakpe.com'], // The user wants to forward to a Google Group from Cloudflare, so sending to support is correct
      replyTo: profile?.email || user.email,
      subject: `${subjectPrefix} from ${profile?.display_name || 'User'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">${type}</h2>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; width: 100px;"><strong>From:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${profile?.display_name || 'Unknown'} &lt;${profile?.email || user.email}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563;"><strong>User ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><code>${user.id}</code></td>
              </tr>
            </table>
            <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px;">Message Details:</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; color: #374151; line-height: 1.5;">${message}</div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send support email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Internal Support Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
