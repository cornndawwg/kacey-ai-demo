'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, ChatMessage } from '@/types';

export default function ChatPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      loadSessions();
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
        setAvailableRoles(data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        if (data.length > 0) {
          setCurrentSession(data[0]);
          setMessages(data[0].messages || []);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      // Get the first available role, or show error if none
      if (availableRoles.length === 0) {
        alert('No roles available. Please seed the database first.');
        return;
      }

      const roleId = availableRoles[0].id;
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roleId: roleId,
          title: `Chat with ${availableRoles[0].title}`
        })
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
      } else {
        const error = await response.json();
        console.error('Error creating session:', error);
        alert('Failed to create chat session: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create chat session');
    }
  };

  const sendMessage = async () => {
    const messageToSend = inputMessage.trim();
    if (!messageToSend || !currentSession || isSending) return;

    setIsSending(true);
    const userMessage = {
      id: Date.now().toString(),
      sessionId: currentSession.id,
      role: 'USER' as const,
      content: messageToSend,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = messageToSend; // Save before clearing
    setInputMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: messageText,
          roleId: currentSession.roleId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add assistant message to the messages list
        if (data.assistantMessage) {
          setMessages(prev => [...prev, {
            id: data.assistantMessage.id,
            sessionId: data.assistantMessage.sessionId,
            role: data.assistantMessage.role,
            content: data.assistantMessage.content,
            sources: data.assistantMessage.sources || data.sources,
            confidence: data.assistantMessage.confidence,
            createdAt: new Date(data.assistantMessage.createdAt)
          }]);
        }
        // Reload sessions to get updated messages
        loadSessions();
      } else {
        const error = await response.json();
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <h1 className="text-xl font-semibold text-gray-900">KaCey AI Chat</h1>
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

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Sessions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Chat Sessions</h2>
                  <button
                    onClick={createNewSession}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    New Chat
                  </button>
                </div>
                <div className="space-y-2 overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setCurrentSession(session);
                        setMessages(session.messages || []);
                      }}
                      className={`w-full text-left p-3 rounded-md text-sm ${
                        currentSession?.id === session.id
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {currentSession?.title || 'Select a chat session'}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!currentSession ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Create a new chat session to get started.</p>
                      <p className="text-sm mt-2">
                        Click "New Chat" in the sidebar to begin.
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <p>Start a conversation by typing a message below.</p>
                      <p className="text-sm mt-2">
                        Ask questions about processes, procedures, or any knowledge captured in the system.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'USER' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'USER'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className={`mt-2 text-xs ${message.role === 'USER' ? 'opacity-75' : 'text-gray-600'}`}>
                              <div className="font-semibold mb-1">Sources:</div>
                              {message.sources.map((source: any, index: number) => (
                                <div key={index} className="truncate">
                                  {source?.artifactTitle || source?.title || `Source ${index + 1}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about the knowledge base..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isSending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isSending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
