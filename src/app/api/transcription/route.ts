import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File; // Changed from 'audio' to 'file' to match client

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to a format OpenAI can use
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a File-like object for OpenAI
    const file = new File([audioBuffer], audioFile.name || 'audio.webm', {
      type: audioFile.type || 'audio/webm'
    });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });
    
    return NextResponse.json({
      text: transcription.text,
      confidence: 0.9, // Whisper doesn't provide confidence scores
      language: (transcription as any).language || 'en'
    });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
