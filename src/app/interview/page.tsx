'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { INTERVIEW_QUESTIONS, PHASE_INFO } from '@/lib/interview-questions';
import VoiceRecorder from '@/components/VoiceRecorder';

export default function InterviewPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('DISCOVERY_HR');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [transcriptionError, setTranscriptionError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const phases = Object.keys(PHASE_INFO) as Array<keyof typeof PHASE_INFO>;
  const currentPhaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === currentPhase);
  const currentQuestion = currentPhaseQuestions[currentQuestionIndex];

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleTranscription = (text: string) => {
    if (currentQuestion) {
      const currentResponse = responses[currentQuestion.id] || '';
      const newResponse = currentResponse + (currentResponse ? ' ' : '') + text;
      handleResponseChange(currentQuestion.id, newResponse);
    }
  };

  const handleTranscriptionError = (error: string) => {
    setTranscriptionError(error);
    setTimeout(() => setTranscriptionError(''), 5000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentPhaseQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next phase
      const currentPhaseIndex = phases.indexOf(currentPhase as keyof typeof PHASE_INFO);
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhase(phases[currentPhaseIndex + 1]);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // Move to previous phase
      const currentPhaseIndex = phases.indexOf(currentPhase as keyof typeof PHASE_INFO);
      if (currentPhaseIndex > 0) {
        setCurrentPhase(phases[currentPhaseIndex - 1]);
        const prevPhaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === phases[currentPhaseIndex - 1]);
        setCurrentQuestionIndex(prevPhaseQuestions.length - 1);
      }
    }
  };

  const getPhaseProgress = (phase: string) => {
    const phaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === phase);
    const answeredQuestions = phaseQuestions.filter(q => responses[q.id]);
    return (answeredQuestions.length / phaseQuestions.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">KaCey AI - Interview Process</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.email} ({user.role})
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Phase Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Interview Progress</h2>
              <span className="text-sm text-gray-600">
                Phase {phases.indexOf(currentPhase as keyof typeof PHASE_INFO) + 1} of {phases.length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {phases.map((phase) => {
                const phaseInfo = PHASE_INFO[phase];
                const progress = getPhaseProgress(phase);
                const isActive = phase === currentPhase;
                
                return (
                  <div
                    key={phase}
                    className={`p-4 rounded-lg border-2 ${
                      isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <h3 className="font-medium text-sm text-gray-900 mb-2">
                      {phaseInfo.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {phaseInfo.duration}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(progress)}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600">
                    {PHASE_INFO[currentPhase as keyof typeof PHASE_INFO].title}
                  </span>
                  <span className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {currentPhaseQuestions.length}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentQuestion.category}
                </h3>
                <p className="text-gray-700 mb-4">
                  {currentQuestion.question}
                </p>
                {currentQuestion.followUp && (
                  <p className="text-sm text-gray-600 italic mb-4">
                    {currentQuestion.followUp}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Response
                    </label>
                    <VoiceRecorder
                      onTranscription={handleTranscription}
                      onError={handleTranscriptionError}
                    />
                  </div>
                  {transcriptionError && (
                    <div className="mb-2 text-sm text-red-600">{transcriptionError}</div>
                  )}
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your response here or use voice recording..."
                    value={responses[currentQuestion.id] || ''}
                    onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                  />
                </div>

                {currentQuestion.allowFileUpload && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Supporting Documents
                    </label>
                    <input
                      type="file"
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentPhase === 'DISCOVERY_HR' && currentQuestionIndex === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentPhase === 'FINAL_ROLE' && currentQuestionIndex === currentPhaseQuestions.length - 1
                      ? 'Complete Interview'
                      : 'Next'
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
