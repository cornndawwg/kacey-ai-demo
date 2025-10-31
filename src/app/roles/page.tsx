'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';

export default function RolesPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({ title: '', description: '', departmentId: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      
      // Only allow ADMIN users
      if (parsedUser.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadData = async () => {
    await Promise.all([loadRoles(), loadDepartments()]);
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

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ title: '', description: '', departmentId: '' });
    setShowRoleModal(true);
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      title: role.title,
      description: role.description || '',
      departmentId: role.departmentId || ''
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = editingRole 
        ? `/api/roles/${editingRole.id}`
        : '/api/roles';
      
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: roleForm.title,
          description: roleForm.description || null,
          departmentId: roleForm.departmentId || null
        })
      });

      if (response.ok) {
        await loadRoles();
        setShowRoleModal(false);
        setRoleForm({ title: '', description: '', departmentId: '' });
        setEditingRole(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      setError('Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadRoles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  const handleCreateDepartment = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setShowDeptModal(true);
  };

  const handleEditDepartment = (dept: any) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || ''
    });
    setShowDeptModal(true);
  };

  const handleSaveDepartment = async () => {
    if (!deptForm.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = editingDept 
        ? `/api/departments/${editingDept.id}`
        : '/api/departments';
      
      const method = editingDept ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: deptForm.name,
          description: deptForm.description || null
        })
      });

      if (response.ok) {
        await loadDepartments();
        setShowDeptModal(false);
        setDeptForm({ name: '', description: '' });
        setEditingDept(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save department');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? All roles must be reassigned first.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/departments/${deptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadDepartments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Manage Roles & Departments</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">Roles & Departments</h2>
          </div>

          {/* Departments Section */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
              <button
                onClick={handleCreateDepartment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Add Department
              </button>
            </div>
            <div className="p-6">
              {departments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No departments yet. Create one to get started.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDepartment(dept)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {dept.description && (
                        <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {dept.roles?.length || 0} role{dept.roles?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Roles Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
              <button
                onClick={handleCreateRole}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Add Role
              </button>
            </div>
            <div className="p-6">
              {roles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No roles yet. Create one to get started.</p>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{role.title}</h4>
                            {role.department && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role.department.name}
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          )}
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span>
                              {role.interviewSessions?.length || 0} interview{role.interviewSessions?.length !== 1 ? 's' : ''}
                            </span>
                            <span>
                              {role.chatSessions?.length || 0} chat{role.chatSessions?.length !== 1 ? 's' : ''}
                            </span>
                            <span>
                              {role.knowledgeArtifacts?.length || 0} artifact{role.knowledgeArtifacts?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm px-3 py-1 border border-indigo-300 rounded hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleForm.title}
                  onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., IT Director"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Role description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={roleForm.departmentId}
                  onChange={(e) => setRoleForm({ ...roleForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setError(null);
                  setRoleForm({ title: '', description: '', departmentId: '' });
                  setEditingRole(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingRole ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., IT, HR, Finance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Department description..."
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeptModal(false);
                  setError(null);
                  setDeptForm({ name: '', description: '' });
                  setEditingDept(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDepartment}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

