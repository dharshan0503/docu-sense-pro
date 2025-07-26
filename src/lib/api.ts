import axios from 'axios';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface FileUpload {
  id: string;
  filename: string;
  status: 'uploaded' | 'processing' | 'failed';
  timestamp: string;
  summary?: string;
  classification?: string;
  confidence?: number;
  size: number;
  type: string;
}

export interface FileDetails extends FileUpload {
  content?: string;
  metadata?: Record<string, any>;
  processingTime?: number;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface Metrics {
  totalFiles: number;
  successRate: number;
  averageProcessingTime: number;
  uploadsToday: number;
  processingQueue: number;
}

export interface FeedbackData {
  fileId: string;
  type: 'summary' | 'classification';
  correctValue: string;
  reason?: string;
}

// API Functions
export const fileApi = {
  // Upload files with progress tracking
  uploadFiles: async (
    files: File[], 
    onProgress?: (fileId: string, progress: number) => void
  ): Promise<FileUpload[]> => {
    const uploads = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            onProgress?.(fileId, progress);
          },
        });
        
        return {
          id: response.data.id || fileId,
          filename: file.name,
          status: 'uploaded' as const,
          timestamp: new Date().toISOString(),
          size: file.size,
          type: file.type,
          ...response.data,
        };
      } catch (error) {
        console.error('Upload failed:', error);
        return {
          id: fileId,
          filename: file.name,
          status: 'failed' as const,
          timestamp: new Date().toISOString(),
          size: file.size,
          type: file.type,
        };
      }
    });
    
    return Promise.all(uploads);
  },

  // Get all files
  getFiles: async (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<FileUpload[]> => {
    try {
      const response = await api.get('/files', { params });
      return response.data.files || response.data;
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Return mock data for development
      return mockFiles;
    }
  },

  // Get file details
  getFileDetails: async (fileId: string): Promise<FileDetails> => {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file details:', error);
      // Return mock data for development
      const mockFile = mockFiles.find(f => f.id === fileId);
      return mockFile || mockFiles[0];
    }
  },

  // Delete file
  deleteFile: async (fileId: string): Promise<void> => {
    try {
      await api.delete(`/files/${fileId}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  // Submit feedback
  submitFeedback: async (feedback: FeedbackData): Promise<void> => {
    try {
      await api.post('/feedback', feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  },

  // Get metrics
  getMetrics: async (): Promise<Metrics> => {
    try {
      const response = await api.get('/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Return mock data for development
      return mockMetrics;
    }
  },
};

// Mock data for development
const mockFiles: FileUpload[] = [
  {
    id: '1',
    filename: 'invoice_2024_001.pdf',
    status: 'uploaded',
    timestamp: '2024-07-26T10:30:00Z',
    summary: 'Monthly invoice for cloud services totaling $1,234.56',
    classification: 'Invoice',
    confidence: 0.95,
    size: 2048000,
    type: 'application/pdf',
  },
  {
    id: '2',
    filename: 'contract_agreement.docx',
    status: 'processing',
    timestamp: '2024-07-26T11:15:00Z',
    size: 1024000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    id: '3',
    filename: 'business_letter.pdf',
    status: 'uploaded',
    timestamp: '2024-07-26T09:45:00Z',
    summary: 'Business correspondence regarding partnership proposal',
    classification: 'Letter',
    confidence: 0.87,
    size: 512000,
    type: 'application/pdf',
  },
  {
    id: '4',
    filename: 'failed_upload.jpg',
    status: 'failed',
    timestamp: '2024-07-26T08:20:00Z',
    size: 3072000,
    type: 'image/jpeg',
  },
];

const mockMetrics: Metrics = {
  totalFiles: 1247,
  successRate: 0.94,
  averageProcessingTime: 12.5,
  uploadsToday: 23,
  processingQueue: 5,
};

export default api;