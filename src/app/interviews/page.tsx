'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { INTERVIEW_QUESTIONS, PHASE_INFO } from '@/lib/interview-questions';

export default function InterviewsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
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
      loadSessions();
      loadRoles();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const calculateProgress = (session: any) => {
    const allQuestions = INTERVIEW_QUESTIONS.length;
    const answeredCount = session.interviewResponses?.filter((r: any) => r.response && r.response.trim()).length || 0;
    return Math.round((answeredCount / allQuestions) * 100);
  };

  const getCurrentPhase = (session: any) => {
    return session.phase || 'DISCOVERY_HR';
  };

  const getPhaseProgress = (session: any, phase: string) => {
    const phaseQuestions = INTERVIEW_QUESTIONS.filter(q => q.phase === phase);
    const answeredInPhase = session.interviewResponses?.filter((r: any) => {
      const matchingQuestion = phaseQuestions.find(q => {
        const questionKey = `${q.category}: ${q.question}`;
        return r.question && r.question.startsWith(questionKey.substring(0, 50));
      });
      return matchingQuestion && r.response && r.response.trim();
    }).length || 0;
    return Math.round((answeredInPhase / phaseQuestions.length) * 100);
  };

  const handleResumeSession = (session: any) => {
    // Store the session role ID and redirect to interview page
    // The interview page will load this session automatically
    if (session.roleId) {
      router.push(`/interview?roleId=${session.roleId}`);
    } else {
      router.push('/interview');
    }
  };

  const handleViewDetails = async (session: any) => {
    // Fetch full session details
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview/sessions/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const fullSession = await response.json();
        setSelectedSession(fullSession);
        setShowDetailsModal(true);
      } else {
        setSelectedSession(session);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSelectedSession(session);
      setShowDetailsModal(true);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesRole = filterRole === 'all' || session.roleId === filterRole;
    return matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const phases = Object.keys(PHASE_INFO) as Array<keyof typeof PHASE_INFO>;

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
              <h1 className="text-xl font-semibold text-gray-900">Interview Sessions</h1>
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Interview Sessions</h2>
            <button
              onClick={() => router.push('/interview')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Start New Interview
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interview sessions found</h3>
                <p className="text-gray-600 mb-4">
                  {filterStatus !== 'all' || filterRole !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Start your first interview to begin capturing knowledge.'
                  }
                </p>
                <button
                  onClick={() => router.push('/interview')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Start New Interview
                </button>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const progress = calculateProgress(session);
                const currentPhase = getCurrentPhase(session);
                const phaseProgress = getPhaseProgress(session, currentPhase);

                return (
                  <div key={session.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {session.role?.title || 'Unknown Role'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Current Phase:</span>
                            <span>{PHASE_INFO[currentPhase as keyof typeof PHASE_INFO]?.title || currentPhase}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Started:</span>
                            <span>{new Date(session.createdAt).toLocaleString()}</span>
                          </div>
                          {session.completedAt && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Completed:</span>
                              <span>{new Date(session.completedAt).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Responses:</span>
                            <span>{session.interviewResponses?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Phase Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {PHASE_INFO[currentPhase as keyof typeof PHASE_INFO]?.title || currentPhase} Progress
                        </span>
                        <span className="text-sm text-gray-600">{phaseProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phaseProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewDetails(session)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        View Details
                      </button>
                      {session.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleResumeSession(session)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                        >
                          Resume Interview
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {selectedSession.role?.title || 'Interview Session'}
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedSession.status)}`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Current Phase:</span>{' '}
                      {PHASE_INFO[getCurrentPhase(selectedSession) as keyof typeof PHASE_INFO]?.title || getCurrentPhase(selectedSession)}
                    </div>
                    <div>
                      <span className="font-medium">Started:</span>{' '}
                      {new Date(selectedSession.createdAt).toLocaleString()}
                    </div>
                    {selectedSession.completedAt && (
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {new Date(selectedSession.completedAt).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Total Responses:</span>{' '}
                      {selectedSession.interviewResponses?.length || 0}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Phase Progress Overview */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Phase Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {phases.map((phase) => {
                    const phaseInfo = PHASE_INFO[phase];
                    const phaseProgress = getPhaseProgress(selectedSession, phase);
                    const isCurrentPhase = phase === getCurrentPhase(selectedSession);
                    
                    return (
                      <div
                        key={phase}
                        className={`p-3 rounded-lg border-2 ${
                          isCurrentPhase ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {phaseInfo.title}
                        </h4>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isCurrentPhase ? 'bg-indigo-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${phaseProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">{phaseProgress}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Responses */}
              {selectedSession.interviewResponses && selectedSession.interviewResponses.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Interview Responses ({selectedSession.interviewResponses.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedSession.interviewResponses
                      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((response: any) => {
                        // Find matching question
                        const matchingQuestion = INTERVIEW_QUESTIONS.find(q => {
                          const questionKey = `${q.category}: ${q.question}`;
                          return response.question && response.question.startsWith(questionKey.substring(0, 50));
                        });

                        return (
                          <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {matchingQuestion?.category || 'Question'}
                                  </span>
                                  {response.tag && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {response.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  {matchingQuestion?.question || response.question}
                                </p>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(response.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            {response.response && (
                              <div className="bg-gray-50 rounded-md p-3 mt-2">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                  {response.response}
                                </p>
                              </div>
                            )}
                            {response.confidence && (
                              <div className="text-xs text-gray-500 mt-2">
                                Confidence: {(response.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-end space-x-3">
              {selectedSession.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleResumeSession(selectedSession);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                >
                  Resume Interview
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSession(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

