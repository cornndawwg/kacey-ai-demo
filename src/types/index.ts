export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  roles?: Role[];
}

export interface Role {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  departmentId?: string;
  department?: Department;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewSession {
  id: string;
  roleId: string;
  phase: 'DISCOVERY_HR' | 'CORE_ROLE' | 'SUPPORTING_ROLES' | 'LEADERSHIP_ALIGNMENT' | 'FINAL_ROLE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewResponse {
  id: string;
  sessionId: string;
  question: string;
  response?: string;
  transcript?: string;
  audioUrl?: string;
  phase: string;
  tag?: 'PROCESS' | 'DECISION' | 'RELATIONSHIP' | 'EXCEPTION';
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArtifact {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'DOC' | 'DOCX' | 'TXT' | 'CSV' | 'XLSX' | 'HTML' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'OTHER';
  fileUrl?: string;
  content?: string;
  metadata?: any;
  roleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  artifactId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata?: any;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  roleId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  sources?: any[];
  confidence?: number;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyName?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export interface ChatResponse {
  message: string;
  sources: any[];
  confidence: number;
}

