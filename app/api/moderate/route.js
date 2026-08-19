import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { title, content, mediaUrl, mediaType } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Skipping AI moderation.");
      return NextResponse.json({ isSafe: true });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
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
        // Continue moderation with just text if image fails
      }
    }

    const response = await model.generateContent(parts);

    const resultText = response.response.text();
    // In case the model wraps the response in a markdown code block, remove it.
    const cleanText = resultText.replace(/```json\n/g, '').replace(/\n```/g, '');
    const result = JSON.parse(cleanText);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Moderation error:', error);
    // Fail open - if moderation service is down, don't block users completely, but log the error
    return NextResponse.json({ isSafe: true, error: error.message }, { status: 200 });
  }
}
