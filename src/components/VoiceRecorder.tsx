'use client';

import { useState, useRef, useEffect } from 'react';
import { RealTimeTranscriber } from '@/lib/transcription';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onError: (error: string) => void;
}

export default function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const transcriberRef = useRef<RealTimeTranscriber | null>(null);

  const startRecording = async () => {
    try {
      setIsTranscribing(true);
      transcriberRef.current = new RealTimeTranscriber((text) => {
        onTranscription(text);
      });
      
      await transcriberRef.current.startRealTimeTranscription();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
      setIsTranscribing(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (transcriberRef.current) {
        await transcriberRef.current.stopRealTimeTranscription();
      }
      setIsRecording(false);
      setIsTranscribing(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      onError('Failed to stop recording.');
    }
  };

  useEffect(() => {
    return () => {
      if (transcriberRef.current && isRecording) {
        transcriberRef.current.stopRealTimeTranscription();
      }
    };
  }, [isRecording]);

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing && !isRecording}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isTranscribing && !isRecording ? (
          'Starting...'
        ) : isRecording ? (
          'Stop Recording'
        ) : (
          'Start Recording'
        )}
      </button>
      
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Recording...</span>
        </div>
      )}
    </div>
  );
}
