'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';

export default function KnowledgePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadRoleId, setUploadRoleId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
      loadDepartments();
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

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesRole = selectedRole === 'all' || artifact.roleId === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || 
      (artifact.role?.departmentId === selectedDepartment);
    const matchesType = selectedType === 'all' || artifact.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRole && matchesDepartment && matchesType && matchesSearch;
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

  const handleViewDetails = async (artifact: any) => {
    // Fetch full artifact with all chunks
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/knowledge/artifacts/${artifact.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const fullArtifact = await response.json();
        setSelectedArtifact(fullArtifact);
        setShowDetailsModal(true);
      } else {
        // If endpoint doesn't exist, use the artifact we have
        setSelectedArtifact(artifact);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching artifact details:', error);
      // Use the artifact we have
      setSelectedArtifact(artifact);
      setShowDetailsModal(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        // Auto-fill title from filename (remove extension)
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('description', uploadDescription);
      if (uploadRoleId) {
        formData.append('roleId', uploadRoleId);
      }

      const response = await fetch('/api/knowledge/artifacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccess(true);
        
        // Note: Embeddings will be generated in the background by the API
        // or can be generated manually later if needed

        // Reset form
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadRoleId('');
        
        // Reload artifacts
        await loadArtifacts();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(false);
        }, 2000);
      } else {
        const error = await response.json();
        setUploadError(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (artifact: any) => {
    if (!artifact.content) {
      alert('No content available to download');
      return;
    }

    // Create a blob with the content
    const content = artifact.content;
    let blob: Blob;
    let filename: string;

    switch (artifact.type) {
      case 'PDF':
        // For PDF, we'd need the actual file. For now, create a text file
        blob = new Blob([content], { type: 'text/plain' });
        filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        break;
      case 'DOCX':
      case 'DOC':
        blob = new Blob([content], { type: 'text/plain' });
        filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        break;
      case 'XLSX':
      case 'CSV':
        blob = new Blob([content], { type: 'text/csv' });
        filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.csv`;
        break;
      case 'HTML':
        blob = new Blob([content], { type: 'text/html' });
        filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.html`;
        break;
      case 'TXT':
      default:
        blob = new Blob([content], { type: 'text/plain' });
        filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        break;
    }

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          {/* Header with Upload Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Knowledge Artifacts</h2>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>📤</span>
                <span>Upload Document</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    // Reset role filter when department changes
                    if (e.target.value !== 'all') {
                      setSelectedRole('all');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={selectedDepartment !== 'all'}
                >
                  <option value="all">
                    {selectedDepartment !== 'all' 
                      ? 'All Roles in Department' 
                      : 'All Roles'}
                  </option>
                  {roles
                    .filter(role => 
                      selectedDepartment === 'all' || 
                      role.departmentId === selectedDepartment
                    )
                    .map((role) => (
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
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(artifact.type)}`}>
                          {artifact.type}
                        </span>
                        {artifact.role?.department && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {artifact.role.department.name}
                          </span>
                        )}
                        {artifact.role && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {artifact.role.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {artifact.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {artifact.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  {artifact.role && (
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="font-medium">{artifact.role.title}</span>
                    </div>
                  )}
                  {artifact.role?.department && (
                    <div className="flex justify-between">
                      <span>Department:</span>
                      <span className="font-medium">{artifact.role.department.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Chunks:</span>
                    <span>{artifact.knowledgeChunks?.length || 0}</span>
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
                    <button
                      onClick={() => handleViewDetails(artifact)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownload(artifact)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
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
                        {searchQuery || selectedRole !== 'all' || selectedDepartment !== 'all' || selectedType !== 'all'
                          ? 'Try adjusting your filters to see more results.'
                          : 'Upload some documents to get started with the knowledge base.'
                        }
                      </p>
                    </div>
                  )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getTypeIcon(selectedArtifact.type)}</span>
                    <h2 className="text-2xl font-semibold text-gray-900">{selectedArtifact.title}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedArtifact.type)}`}>
                      {selectedArtifact.type}
                    </span>
                  </div>
                  {selectedArtifact.description && (
                    <p className="text-gray-600 text-sm">{selectedArtifact.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedArtifact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Metadata */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Metadata</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Chunks:</span>
                    <span className="ml-2 font-medium">{selectedArtifact.knowledgeChunks?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">{new Date(selectedArtifact.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedArtifact.metadata?.wordCount && (
                    <div>
                      <span className="text-gray-600">Words:</span>
                      <span className="ml-2 font-medium">{selectedArtifact.metadata.wordCount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedArtifact.metadata?.pages && (
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">{selectedArtifact.metadata.pages}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {selectedArtifact.content && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Content</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                      {selectedArtifact.content}
                    </pre>
                  </div>
                </div>
              )}

              {/* Chunks */}
              {selectedArtifact.knowledgeChunks && selectedArtifact.knowledgeChunks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Chunks ({selectedArtifact.knowledgeChunks.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedArtifact.knowledgeChunks
                      .sort((a: any, b: any) => a.chunkIndex - b.chunkIndex)
                      .map((chunk: any, index: number) => (
                        <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-500">Chunk {chunk.chunkIndex + 1}</span>
                            <span className="text-xs text-gray-400">{chunk.tokenCount} tokens</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{chunk.content}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-end space-x-3">
              <button
                onClick={() => handleDownload(selectedArtifact)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedArtifact(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Upload Document</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadTitle('');
                    setUploadDescription('');
                    setUploadRoleId('');
                    setUploadError(null);
                    setUploadSuccess(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {uploadSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Uploaded Successfully!</h3>
                  <p className="text-gray-600">The document has been processed and added to the knowledge base.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.html,.htm"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isUploading}
                    />
                    {uploadFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: <span className="font-medium">{uploadFile.name}</span> ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, HTML
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter document title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter document description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Associate with Role
                    </label>
                    <select
                      value={uploadRoleId}
                      onChange={(e) => setUploadRoleId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isUploading}
                    >
                      <option value="">No role (General knowledge)</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!uploadSuccess && (
              <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadTitle('');
                    setUploadDescription('');
                    setUploadRoleId('');
                    setUploadError(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading || !uploadTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUploading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
