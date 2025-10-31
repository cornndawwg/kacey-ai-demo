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
  const [savedResponses, setSavedResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [interviewSession, setInterviewSession] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
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
      loadRoles();
      // Load existing interview session or create new one will be handled after role selection
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        // Auto-select first role if available
        if (data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(data[0].id);
          loadOrCreateSession(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadOrCreateSession = async (roleId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to find existing IN_PROGRESS session for this role
      const sessionsResponse = await fetch('/api/interview/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        const existingSession = sessions.find((s: any) => 
          s.roleId === roleId && s.status === 'IN_PROGRESS'
        );

        if (existingSession) {
          setInterviewSession(existingSession);
          
          // Load saved responses - match by question text prefix (category + question)
          const responsesMap: Record<string, string> = {};
          const savedResponsesMap: Record<string, any> = {};
          
          existingSession.interviewResponses?.forEach((resp: any) => {
            // Find matching question by checking if response question starts with category: question
            const matchingQuestion = INTERVIEW_QUESTIONS.find(q => {
              const questionKey = `${q.category}: ${q.question}`;
              return resp.question && resp.question.startsWith(questionKey.substring(0, 50));
            });
            
            if (matchingQuestion) {
              responsesMap[matchingQuestion.id] = resp.response || '';
              savedResponsesMap[matchingQuestion.id] = resp;
            }
          });
          
          setResponses(responsesMap);
          setSavedResponses(savedResponsesMap);
          
          // Restore phase and question index
          if (existingSession.phase) {
            setCurrentPhase(existingSession.phase);
            // Find the question index for the current phase
            const phaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === existingSession.phase);
            // Find last answered question in this phase
            const lastAnsweredIndex = phaseQuestions.findIndex(q => {
              return responsesMap[q.id] && responsesMap[q.id].trim();
            });
            // If found, go to next unanswered question, otherwise start at beginning
            if (lastAnsweredIndex >= 0 && lastAnsweredIndex < phaseQuestions.length - 1) {
              setCurrentQuestionIndex(lastAnsweredIndex + 1);
            } else {
              setCurrentQuestionIndex(0);
            }
          }
          return;
        }
      }

      // Create new session if none exists
      const createResponse = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roleId: roleId,
          phase: 'DISCOVERY_HR'
        })
      });

      if (createResponse.ok) {
        const newSession = await createResponse.json();
        setInterviewSession(newSession);
      }
    } catch (error) {
      console.error('Error loading/creating session:', error);
    }
  };

  const saveResponse = async (questionId: string, responseText: string) => {
    if (!interviewSession || !responseText.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');
      const question = INTERVIEW_QUESTIONS.find(q => q.id === questionId);
      
      if (!question) {
        return;
      }

      // Check if response already exists (by finding response with matching question)
      const existingResponse = Object.values(savedResponses).find((resp: any) => {
        // Match by checking if the saved response question starts with our question category:question prefix
        const questionKey = `${question.category}: ${question.question}`;
        return resp.question && resp.question.startsWith(questionKey.substring(0, 50));
      });
      
      const responseData = {
        sessionId: interviewSession.id,
        question: `${question.category}: ${question.question}`,
        response: responseText,
        phase: currentPhase,
        tag: question.tag,
        confidence: 0.9 // Could be calculated based on response length, etc.
      };

      let response;
      if (existingResponse?.id) {
        // Update existing response
        response = await fetch('/api/interview/responses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: existingResponse.id,
            response: responseText,
            confidence: 0.9
          })
        });
      } else {
        // Create new response
        response = await fetch('/api/interview/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(responseData)
        });
      }

      if (response.ok) {
        const savedResponse = await response.json();
        setSavedResponses(prev => ({
          ...prev,
          [questionId]: savedResponse
        }));
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        console.error('Error saving response');
        setSaveMessage('Error saving');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSessionPhase = async (newPhase: string) => {
    if (!interviewSession) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/interview/sessions/${interviewSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phase: newPhase
        })
      });
    } catch (error) {
      console.error('Error updating session phase:', error);
    }
  };

  const completeInterview = async () => {
    if (!interviewSession) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview/sessions/${interviewSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          phase: 'FINAL_ROLE',
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Interview completed successfully!');
        router.push('/dashboard');
      } else {
        alert('Error completing interview. Please try again.');
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Error completing interview. Please try again.');
    }
  };

  const phases = Object.keys(PHASE_INFO) as Array<keyof typeof PHASE_INFO>;
  const currentPhaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === currentPhase);
  const currentQuestion = currentPhaseQuestions[currentQuestionIndex];

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
    // Auto-save after 2 seconds of no typing (debounced)
    clearTimeout((window as any).saveTimeout);
    (window as any).saveTimeout = setTimeout(() => {
      if (response.trim()) {
        saveResponse(questionId, response);
      }
    }, 2000);
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

  const handleNextQuestion = async () => {
    // Save current response before moving
    if (currentQuestion && responses[currentQuestion.id]) {
      await saveResponse(currentQuestion.id, responses[currentQuestion.id]);
    }

    if (currentQuestionIndex < currentPhaseQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next phase
      const currentPhaseIndex = phases.indexOf(currentPhase as keyof typeof PHASE_INFO);
      if (currentPhaseIndex < phases.length - 1) {
        const nextPhase = phases[currentPhaseIndex + 1];
        setCurrentPhase(nextPhase);
        setCurrentQuestionIndex(0);
        // Update session phase in database
        await updateSessionPhase(nextPhase);
      } else {
        // This is the last question - complete interview
        await completeInterview();
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
          {/* Role Selection (if no session) */}
          {!interviewSession && roles.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Role for Interview</h2>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  if (e.target.value) {
                    loadOrCreateSession(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phase Progress */}
          {interviewSession && (
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
          )}

          {/* Current Question */}
          {interviewSession && currentQuestion && (
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
                  <div className="flex items-center space-x-3">
                    {saveMessage && (
                      <span className={`text-sm ${saveMessage === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
                        {saveMessage}
                      </span>
                    )}
                    {isSaving && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Saving...</span>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (currentQuestion && responses[currentQuestion.id]) {
                          await saveResponse(currentQuestion.id, responses[currentQuestion.id]);
                        }
                      }}
                      disabled={!currentQuestion || !responses[currentQuestion.id] || isSaving}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Save
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
