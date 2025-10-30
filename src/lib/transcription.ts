import OpenAI from 'openai';
import { TranscriptionResult } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      text: result.text,
      confidence: 0.9, // Whisper doesn't provide confidence scores, using default
      language: result.language || 'en'
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

export class RealTimeTranscriber {
  private audioRecorder: AudioRecorder;
  private transcriptionCallback: (text: string) => void;
  private isTranscribing = false;

  constructor(transcriptionCallback: (text: string) => void) {
    this.audioRecorder = new AudioRecorder();
    this.transcriptionCallback = transcriptionCallback;
  }

  async startRealTimeTranscription(): Promise<void> {
    if (this.isTranscribing) {
      return;
    }

    this.isTranscribing = true;
    await this.audioRecorder.startRecording();

    // Process audio chunks every 3 seconds
    const interval = setInterval(async () => {
      if (!this.audioRecorder.isCurrentlyRecording()) {
        clearInterval(interval);
        return;
      }

      try {
        // Stop current recording and start new one
        const audioBlob = await this.audioRecorder.stopRecording();
        if (audioBlob.size > 0) {
          const result = await transcribeAudio(audioBlob);
          this.transcriptionCallback(result.text);
        }
        
        // Start new recording
        await this.audioRecorder.startRecording();
      } catch (error) {
        console.error('Real-time transcription error:', error);
      }
    }, 3000);
  }

  async stopRealTimeTranscription(): Promise<void> {
    if (!this.isTranscribing) {
      return;
    }

    this.isTranscribing = false;
    
    try {
      const finalAudioBlob = await this.audioRecorder.stopRecording();
      if (finalAudioBlob.size > 0) {
        const result = await transcribeAudio(finalAudioBlob);
        this.transcriptionCallback(result.text);
      }
    } catch (error) {
      console.error('Error stopping real-time transcription:', error);
    }
  }

  isCurrentlyTranscribing(): boolean {
    return this.isTranscribing;
  }
}
