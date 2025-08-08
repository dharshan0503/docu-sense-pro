import { supabase } from '@/integrations/supabase/client';

export interface FileUpload {
  id: string;
  filename: string;
  type?: string;
  size: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  classification?: string;
  summary?: string;
  confidence?: number;
  doc_type?: string;
  extracted_text?: string;
  entities?: any;
}

export interface FileDetails extends FileUpload {
  content?: string;
  metadata?: Record<string, any>;
  processingTime?: number;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
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
  feedbackType: 'summary' | 'classification';
  correctValue: string;
  reason?: string;
}

export interface FileFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const fileApi = {
  async uploadFiles(files: File[], onProgress?: (fileId: string, progress: number) => void): Promise<Array<{status: string}>> {
    const results: Array<{status: string}> = [];
    
    for (const file of files) {
      try {
        const fileId = crypto.randomUUID();
        
        // Simulate progress
        if (onProgress) {
          for (let i = 0; i <= 75; i += 25) {
            setTimeout(() => onProgress(fileId, i), i * 20);
          }
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Enhanced text content extraction
        let textContent = '';
        try {
          if (file.type.includes('text')) {
            textContent = await file.text();
          } else if (file.type.includes('pdf')) {
            // For PDF files, we would use a PDF parser in production
            // For now, using filename and basic metadata
            const reader = new FileReader();
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = reject;
              reader.readAsArrayBuffer(file);
            });
            
            // Basic PDF detection and metadata extraction
            const uint8Array = new Uint8Array(arrayBuffer);
            const decoder = new TextDecoder('utf-8', { fatal: false });
            let rawText = decoder.decode(uint8Array);
            
            // Extract readable text from PDF (basic approach)
            const textMatches = rawText.match(/\w+/g);
            if (textMatches && textMatches.length > 10) {
              textContent = textMatches.slice(0, 100).join(' ');
            } else {
              textContent = `PDF document: ${file.name}. Size: ${file.size} bytes. Contains ${uint8Array.length} bytes of data.`;
            }
          } else if (file.type.includes('image')) {
            textContent = `Image file: ${file.name}. Type: ${file.type}. Size: ${file.size} bytes. Image analysis would extract visual content in production.`;
          } else if (file.type.includes('word') || file.type.includes('document')) {
            textContent = `Document file: ${file.name}. Type: ${file.type}. Size: ${file.size} bytes. Document parsing would extract content in production.`;
          } else {
            textContent = `File: ${file.name}. Type: ${file.type}. Size: ${file.size} bytes. Binary content analysis available.`;
          }
        } catch (error) {
          console.error('Error extracting content:', error);
          textContent = `File: ${file.name}. Content extraction failed but file uploaded successfully.`;
        }

        // Insert into database with initial status and better error handling
        const { data: insertData, error } = await supabase.from('documents').insert({
          file_id: fileId,
          user_id: user.id,
          filename: file.name,
          doc_type: file.type,
          status: 'processing',
          extracted_text: textContent.substring(0, 500),
          confidence: 0.5,
          entities: {
            file_size: file.size,
            upload_time: new Date().toISOString(),
            content_preview: textContent.substring(0, 200)
          }
        }).select();

        if (error) {
          console.error('Database error:', error);
          throw new Error(`Failed to save file to database: ${error.message}`);
        }

        console.log(`File ${file.name} saved to database successfully`);

        // Trigger AI analysis in background with improved error handling
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke('analyze-document', {
            body: {
              fileId,
              content: textContent,
              fileName: file.name,
              mimeType: file.type
            }
          });

          if (functionError) {
            console.error('AI analysis function error:', functionError);
            // Update status to indicate analysis failed but file uploaded
            await supabase.from('documents').update({
              status: 'uploaded',
              extracted_text: 'File uploaded successfully. AI analysis failed - manual review available.'
            }).eq('file_id', fileId);
          } else {
            console.log('AI analysis triggered successfully for:', file.name);
          }
        } catch (analysisError) {
          console.error('Failed to trigger analysis for', file.name, ':', analysisError);
          // Mark as uploaded even if analysis fails
          await supabase.from('documents').update({
            status: 'uploaded',
            extracted_text: 'File uploaded successfully. AI analysis unavailable - manual review recommended.'
          }).eq('file_id', fileId);
        }
        
        // Final progress update
        if (onProgress) {
          setTimeout(() => onProgress(fileId, 100), 2000);
        }
        
        results.push({ status: 'success' });
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
        results.push({ status: 'failed' });
      }
    }
    
    return results;
  },

  async getFiles(filters?: FileFilters): Promise<FileUpload[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`filename.ilike.%${filters.search}%,doc_type.ilike.%${filters.search}%,extracted_text.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(doc => ({
        id: doc.file_id,
        filename: doc.filename,
        type: doc.doc_type,
        size: Math.floor(Math.random() * 1000000) + 100000, // Mock size for now
        status: doc.status as any,
        timestamp: doc.created_at,
        classification: generateMockClassification(doc.filename),
        summary: doc.extracted_text?.substring(0, 100) + '...',
        confidence: doc.confidence,
        doc_type: doc.doc_type,
        extracted_text: doc.extracted_text,
        entities: doc.entities,
      }));
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    }
  },

  async getFileDetails(fileId: string): Promise<FileDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.file_id,
        filename: data.filename,
        type: data.doc_type,
        size: Math.floor(Math.random() * 1000000) + 100000,
        status: data.status as any,
        timestamp: data.created_at,
        classification: generateMockClassification(data.filename),
        summary: data.extracted_text?.substring(0, 100) + '...',
        confidence: data.confidence,
        content: data.extracted_text,
        metadata: data.entities as Record<string, any> || {},
      };
    } catch (error) {
      console.error('Failed to fetch file details:', error);
      throw error;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('file_id', fileId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  async submitFeedback(feedback: FeedbackData): Promise<void> {
    console.log('Submitting feedback:', feedback);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('process-feedback', {
        body: {
          fileId: feedback.fileId,
          feedbackType: feedback.feedbackType,
          correctValue: feedback.correctValue,
          reason: feedback.reason,
          userId: user.id
        }
      });

      if (error) {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  },

  async getMetrics(): Promise<Metrics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('documents')
        .select('status, created_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const totalFiles = data.length;
      const successCount = data.filter(doc => doc.status === 'uploaded').length;
      const today = new Date().toDateString();
      const uploadsToday = data.filter(doc => 
        new Date(doc.created_at).toDateString() === today
      ).length;
      
      return {
        totalFiles,
        successRate: totalFiles > 0 ? successCount / totalFiles : 0,
        averageProcessingTime: 12.5,
        uploadsToday,
        processingQueue: data.filter(doc => doc.status === 'processing').length,
      };
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return {
        totalFiles: 0,
        successRate: 0,
        averageProcessingTime: 0,
        uploadsToday: 0,
        processingQueue: 0,
      };
    }
  },
};

// Helper functions for generating mock data
const generateMockSummary = (filename: string): string => {
  const summaries = [
    `Comprehensive analysis of ${filename} reveals key insights and important data points`,
    `Document contains structured information with high relevance and accuracy`,
    `Professional document with detailed content and proper formatting`,
    `Business document containing critical information and actionable insights`,
    `Well-organized file with comprehensive data and analysis results`
  ];
  return summaries[Math.floor(Math.random() * summaries.length)];
};

const generateMockClassification = (filename: string): string => {
  const name = filename.toLowerCase();
  if (name.includes('invoice')) return 'Invoice';
  if (name.includes('contract')) return 'Contract';
  if (name.includes('letter')) return 'Letter';
  if (name.includes('report')) return 'Report';
  if (name.includes('resume')) return 'Resume';
  
  const classifications = ['Invoice', 'Contract', 'Letter', 'Report', 'Proposal', 'Agreement'];
  return classifications[Math.floor(Math.random() * classifications.length)];
};