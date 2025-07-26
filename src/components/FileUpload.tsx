import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fileApi, type UploadProgress } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      status: 'pending' as const,
    }));

    setFilesWithProgress(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/*': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (id: string) => {
    setFilesWithProgress(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (filesWithProgress.length === 0) return;

    setIsUploading(true);
    
    try {
      // Update status to uploading
      setFilesWithProgress(prev => 
        prev.map(f => ({ ...f, status: 'uploading' as const }))
      );

      const files = filesWithProgress.map(f => f.file);
      
      const handleProgress = (fileId: string, progress: number) => {
        setFilesWithProgress(prev =>
          prev.map(f => 
            f.file.name === files.find(file => file.name === f.file.name)?.name
              ? { ...f, progress }
              : f
          )
        );
      };

      const results = await fileApi.uploadFiles(files, handleProgress);
      
      // Update final status
      setFilesWithProgress(prev =>
        prev.map((f, index) => ({
          ...f,
          progress: 100,
          status: results[index]?.status === 'failed' ? 'error' : 'completed',
        }))
      );

      const successCount = results.filter(r => r.status !== 'failed').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      if (successCount > 0) {
        toast({
          title: "Upload Successful",
          description: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      if (failCount > 0) {
        toast({
          title: "Upload Failed",
          description: `${failCount} file(s) failed to upload`,
          variant: "destructive",
        });
      }

      onUploadComplete?.();
      
      // Clear completed uploads after a delay
      setTimeout(() => {
        setFilesWithProgress([]);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setFilesWithProgress(prev =>
        prev.map(f => ({ ...f, status: 'error' as const }))
      );
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, Word docs, images, and text files (max 10MB each)
              </p>
            </div>
          </div>

          {/* File List */}
          {filesWithProgress.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Files to upload</h3>
              {filesWithProgress.map((fileWithProgress) => (
                <div
                  key={fileWithProgress.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(fileWithProgress.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileWithProgress.file.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithProgress.file.size)}
                      </span>
                    </div>
                    
                    {fileWithProgress.status === 'uploading' && (
                      <Progress value={fileWithProgress.progress} className="h-2" />
                    )}
                    
                    {fileWithProgress.status === 'completed' && (
                      <div className="text-xs text-success">✓ Upload complete</div>
                    )}
                    
                    {fileWithProgress.status === 'error' && (
                      <div className="text-xs text-destructive">✗ Upload failed</div>
                    )}
                  </div>

                  {fileWithProgress.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileWithProgress.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Upload Button */}
              <div className="flex justify-end">
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || filesWithProgress.every(f => f.status !== 'pending')}
                  className="bg-gradient-primary"
                >
                  {isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {filesWithProgress.filter(f => f.status === 'pending').length} File(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;