'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';

export default function KnowledgePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
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
      loadArtifacts();
      loadRoles();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadArtifacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/knowledge/artifacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setArtifacts(data);
      }
    } catch (error) {
      console.error('Error loading artifacts:', error);
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

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesRole = selectedRole === 'all' || artifact.roleId === selectedRole;
    const matchesType = selectedType === 'all' || artifact.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRole && matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'DOCX':
      case 'DOC':
        return '📝';
      case 'XLSX':
      case 'CSV':
        return '📊';
      case 'HTML':
        return '🌐';
      case 'TXT':
        return '📃';
      default:
        return '📎';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800';
      case 'DOCX':
      case 'DOC':
        return 'bg-blue-100 text-blue-800';
      case 'XLSX':
      case 'CSV':
        return 'bg-green-100 text-green-800';
      case 'HTML':
        return 'bg-purple-100 text-purple-800';
      case 'TXT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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
              <h1 className="text-xl font-semibold text-gray-900">Knowledge Base</h1>
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artifacts..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="PDF">PDF</option>
                  <option value="DOCX">Word Document</option>
                  <option value="XLSX">Excel Spreadsheet</option>
                  <option value="CSV">CSV</option>
                  <option value="HTML">HTML</option>
                  <option value="TXT">Text File</option>
                </select>
              </div>
            </div>
          </div>

          {/* Artifacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtifacts.map((artifact) => (
              <div key={artifact.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(artifact.type)}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {artifact.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(artifact.type)}`}>
                        {artifact.type}
                      </span>
                    </div>
                  </div>
                </div>

                {artifact.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {artifact.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Chunks:</span>
                    <span>{artifact.chunks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>
                  </div>
                  {artifact.metadata?.wordCount && (
                    <div className="flex justify-between">
                      <span>Words:</span>
                      <span>{artifact.metadata.wordCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredArtifacts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artifacts found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedRole !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Upload some documents to get started with the knowledge base.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
