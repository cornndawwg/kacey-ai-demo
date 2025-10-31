'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';

interface DashboardStats {
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    inProgressInterviews: number;
    totalArtifacts: number;
    totalChatSessions: number;
    totalRoles: number;
  };
  recent: {
    interviews: any[];
    artifacts: any[];
    chatSessions: any[];
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadDashboardStats();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
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
              <h1 className="text-xl font-semibold text-gray-900">KaCey AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.email} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to KaCey AI Dashboard
            </h2>
            <p className="text-gray-600">
              Knowledge Continuity AI Platform
            </p>
          </div>

          {/* Statistics Cards */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Interviews */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Interviews</h3>
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalInterviews}</p>
                <div className="mt-2 flex space-x-4 text-sm text-gray-600">
                  <span>{dashboardData.stats.completedInterviews} completed</span>
                  <span>{dashboardData.stats.inProgressInterviews} in progress</span>
                </div>
              </div>

              {/* Total Artifacts */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Knowledge Artifacts</h3>
                  <span className="text-2xl">📚</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalArtifacts}</p>
                <p className="mt-2 text-sm text-gray-600">Documents in knowledge base</p>
              </div>

              {/* Total Chat Sessions */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Chat Sessions</h3>
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalChatSessions}</p>
                <p className="mt-2 text-sm text-gray-600">AI conversations</p>
              </div>

              {/* Total Roles */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Roles</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalRoles}</p>
                <p className="mt-2 text-sm text-gray-600">Roles tracked</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.stats.totalInterviews > 0
                    ? Math.round((dashboardData.stats.completedInterviews / dashboardData.stats.totalInterviews) * 100)
                    : 0}%
                </p>
                <p className="mt-2 text-sm text-gray-600">Interviews completed</p>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-indigo-100">Quick Actions</h3>
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="space-y-2">
                  <a
                    href="/interview"
                    className="block w-full bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  >
                    Start Interview
                  </a>
                  <a
                    href="/chat"
                    className="block w-full bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  >
                    Start Chat
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Interviews */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Interviews</h3>
                  <a href="/interviews" className="text-sm text-indigo-600 hover:text-indigo-700">
                    View All
                  </a>
                </div>
                {dashboardData.recent.interviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No interviews yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recent.interviews.map((interview) => (
                      <div key={interview.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {interview.role?.title || 'Unknown Role'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            interview.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : interview.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(interview.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Artifacts */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Artifacts</h3>
                  <a href="/knowledge" className="text-sm text-indigo-600 hover:text-indigo-700">
                    View All
                  </a>
                </div>
                {dashboardData.recent.artifacts.length === 0 ? (
                  <p className="text-sm text-gray-500">No artifacts yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recent.artifacts.map((artifact) => (
                      <div key={artifact.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {artifact.title}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">{artifact.type}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Chat Sessions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
                  <a href="/chat" className="text-sm text-indigo-600 hover:text-indigo-700">
                    View All
                  </a>
                </div>
                {dashboardData.recent.chatSessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No chat sessions yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recent.chatSessions.map((session) => (
                      <div key={session.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {session.title || session.role?.title || 'Untitled Chat'}
                          </span>
                        </div>
                        {session.chatMessages && session.chatMessages.length > 0 && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                            {session.chatMessages[0].content}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {user.role === 'ADMIN' && (
                <>
                  <a
                    href="/interview"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🎤</span>
                    <span>Start Interview</span>
                  </a>
                  <a
                    href="/interviews"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Manage Interviews</span>
                  </a>
                  <a
                    href="/knowledge"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📚</span>
                    <span>Knowledge Base</span>
                  </a>
                  <a
                    href="/chat"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>AI Chat</span>
                  </a>
                </>
              )}
              {user.role === 'EMPLOYEE' && (
                <>
                  <a
                    href="/chat"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>AI Chat</span>
                  </a>
                  <a
                    href="/knowledge"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📚</span>
                    <span>Knowledge Base</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
