import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateSignature(action, targetId, authorId) {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) return '';
  const payload = `${action}:${targetId}:${authorId || 'none'}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

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

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate Limiting Check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('report_logs')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) throw countError;
    
    if (count >= 3) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // 3. Parse Body
    const body = await request.json();
    const { post_id, comment_id, reason, details, post_content } = body;

    if (!reason || (!post_id && !comment_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Log the report (for rate limiting)
    const { error: logError } = await supabase.from('report_logs').insert({
      reporter_id: user.id
    });
    if (logError) throw logError;

    // 5. Fetch reporter details for the email
    const { data: profile } = await supabase.from('profiles').select('email, display_name').eq('id', user.id).single();

    // 6. Build Supabase Dashboard Link & Signatures
    const targetTable = comment_id ? 'comments' : 'posts';
    const targetId = comment_id || post_id;
    
    // We need the original author ID to deduct points. We must fetch it.
    const { data: targetData } = await supabase.from(targetTable).select('author_id').eq('id', targetId).single();
    const authorId = targetData?.author_id || '';

    const dashboardLink = `https://supabase.com/dashboard/project/meezxcykzndoopudrydv/editor/${targetTable}?filter=id%3Aeq%3A${targetId}`;
    
    // Generate secure Action Links
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://baithakpe.com';
    const rejectSig = generateSignature('reject', targetId, authorId);
    const acceptSig = generateSignature('accept', targetId, authorId);
    
    const rejectLink = `${baseUrl}/api/admin/moderate?action=reject&targetId=${targetId}&targetTable=${targetTable}&authorId=${authorId}&token=${rejectSig}`;
    const acceptLink = `${baseUrl}/api/admin/moderate?action=accept&targetId=${targetId}&targetTable=${targetTable}&authorId=${authorId}&token=${acceptSig}`;

    // 7. Dispatch Email
    const { data, error } = await resend.emails.send({
      from: 'Baithak Support <support@baithakpe.com>', // Assuming verified domain
      to: ['report@baithakpe.com'], // Forwards to Google Group
      replyTo: profile?.email || user.email,
      subject: `🚩 [CONTENT REPORT] ${reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #DC2626; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Content Report</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${reason}</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; width: 120px;"><strong>Reporter:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${profile?.display_name || 'Unknown'} &lt;${profile?.email || user.email}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563;"><strong>Reporter ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><code>${user.id}</code></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563;"><strong>Target ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><code>${targetId}</code></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563;"><strong>Target Type:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${comment_id ? 'Comment' : 'Post'}</td>
              </tr>
            </table>

            <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px;">Additional Context:</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; color: #374151; line-height: 1.5; margin-bottom: 24px;">${details || 'No additional details provided.'}</div>

            <h3 style="color: #111827; margin-bottom: 12px; font-size: 16px;">Reported Content Snippet:</h3>
            <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; border: 1px solid #fecaca; white-space: pre-wrap; color: #991b1b; line-height: 1.5; margin-bottom: 32px;">${post_content || 'Content not captured.'}</div>

            <!-- ONE-CLICK MODERATION ACTIONS -->
            <div style="text-align: center; border-top: 2px dashed #e5e7eb; padding-top: 24px;">
              <h3 style="color: #111827; margin-bottom: 24px; font-size: 18px;">1-Click Moderation Actions</h3>
              
              <a href="${rejectLink}" style="background-color: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-bottom: 16px; width: 100%; box-sizing: border-box; text-align: center;">✅ Reject Report (Post is Safe)</a>
              
              <a href="${acceptLink}" style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-bottom: 24px; width: 100%; box-sizing: border-box; text-align: center;">🚨 Accept & Delete Content (-20 HP Penalty)</a>
              
              <p style="color: #6B7280; font-size: 13px; margin: 0;">Or view manually in <a href="${dashboardLink}" style="color: #2563EB;">Supabase Dashboard</a>.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: 'Failed to send report email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Internal Report API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
