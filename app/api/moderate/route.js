import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { postId, title, content, mediaUrl, mediaType } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Skipping AI moderation.");
      return NextResponse.json({ isSafe: true });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    let parts = [
      `You are a strict automated content moderator for a university social platform.
      Evaluate the following post title, content, and attached image (if any).
      Determine if it violates community guidelines: 
      - No harassment, hate speech, or explicit content.
      - No spam, advertising, or selling of goods.
      - No counterfeit goods, scams, or illicit activities (e.g. "fake Rolex", "cheap watches", "essay writing services").
      Return a JSON response strictly in this format: {"isSafe": boolean, "reason": "string explaining why if unsafe, or empty string if safe"}
      
      Post Title: ${title}
      Post Content: ${content}`
    ];

    if (mediaUrl && mediaType === 'image') {
      try {
        const imageResponse = await fetch(mediaUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Image = buffer.toString('base64');
          
          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
            }
          });
        }
      } catch (imgError) {
        console.error("Failed to fetch image for moderation:", imgError);
      }
    }

    const response = await model.generateContent(parts);
    const resultText = response.response.text();
    const cleanText = resultText.replace(/```json\n/g, '').replace(/\n```/g, '');
    const result = JSON.parse(cleanText);

    // If unsafe, delete it from the database!
    if (result.isSafe === false && postId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      await supabase.from('posts').delete().eq('id', postId);
      console.log(`[MODERATION] Deleted unsafe post ${postId}: ${result.reason}`);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ isSafe: true, error: error.message }, { status: 200 });
  }
}
