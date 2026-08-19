import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function verifySignature(action, targetId, authorId, token) {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) return false;
  const payload = `${action}:${targetId}:${authorId || 'none'}`;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  return token === expectedToken;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const targetId = searchParams.get('targetId');
    const targetTable = searchParams.get('targetTable');
    const authorId = searchParams.get('authorId');
    const token = searchParams.get('token');

    if (!action || !targetId || !targetTable || !token) {
      return new NextResponse('Missing required parameters.', { status: 400 });
    }

    // 1. Verify the secure token
    const isValid = verifySignature(action, targetId, authorId, token);
    if (!isValid) {
      return new NextResponse(
        '<h1 style="color:red; font-family:sans-serif; padding: 20px;">Unauthorized: Invalid or expired security token.</h1>',
        { status: 401, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // 2. Handle Reject Action (Mark as safe)
    if (action === 'reject') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
        await supabaseAdmin.from(targetTable).update({ status: 'active' }).eq('id', targetId);
      }
      
      return new NextResponse(`
        <div style="font-family:sans-serif; padding: 40px; text-align:center;">
          <h1 style="color:#10B981;">Report Rejected</h1>
          <p>You have marked this content as safe and it has been restored to the feed.</p>
          <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer; background: #e5e7eb; border: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Close Window</button>
        </div>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // 3. Handle Accept & Delete Action
    if (action === 'accept') {
      // Must use Service Role Key to bypass RLS since the admin isn't logged into a Supabase session
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return new NextResponse('Server configuration error: Missing service role key.', { status: 500 });
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // A. Delete the content
      const { error: deleteError } = await supabaseAdmin
        .from(targetTable)
        .delete()
        .eq('id', targetId);

      if (deleteError) {
        console.error('Admin delete error:', deleteError);
        return new NextResponse(`Error deleting content: ${deleteError.message}`, { status: 500 });
      }

      // B. Deduct Honor Points
      if (authorId && authorId !== 'none') {
        const { error: rpcError } = await supabaseAdmin.rpc('award_honor_points', {
          p_user_id: authorId,
          p_action_type: 'CONTENT_REMOVED',
          p_points: -20
        });

        if (rpcError) {
          console.error('Admin HP deduction error:', rpcError);
          // We still consider it a success if the post was deleted
        }
      }

      return new NextResponse(`
        <div style="font-family:sans-serif; padding: 40px; text-align:center;">
          <h1 style="color:#DC2626;">Content Deleted</h1>
          <p>The ${targetTable === 'comments' ? 'comment' : 'post'} has been permanently removed from Baithak.</p>
          ${authorId && authorId !== 'none' ? '<p><strong>20 Honor Points</strong> were automatically deducted from the author.</p>' : ''}
          <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer; background: #e5e7eb; border: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Close Window</button>
        </div>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    return new NextResponse('Invalid action.', { status: 400 });

  } catch (error) {
    console.error('Admin moderation endpoint error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
