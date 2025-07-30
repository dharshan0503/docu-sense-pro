import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, File, Sparkles, Zap, Star, CheckCircle } from 'lucide-react';
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
    <div className="w-full animate-fade-in">
      {/* Magical Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 glass-effect border border-primary/20">
        <div className="absolute inset-0 bg-gradient-hero animate-gradient opacity-20"></div>
        <div className="relative p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary mr-3 animate-float" />
            <h2 className="text-3xl font-bold text-gradient">AI-Powered Upload Center</h2>
            <Zap className="h-8 w-8 text-warning ml-3 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">
            Experience lightning-fast uploads with intelligent analysis
          </p>
        </div>
      </div>

      <Card className="w-full glass-effect border-primary/20 shadow-glow animate-bounce-in">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Enhanced Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-500 hover-lift morphing-border overflow-hidden",
                isDragActive 
                  ? "border-primary bg-gradient-primary/20 shadow-glow scale-105 animate-pulse-glow" 
                  : "border-primary/30 hover:border-primary hover:bg-gradient-primary/10 hover:shadow-colored"
              )}
            >
              <input {...getInputProps()} />
              
              {/* Animated Background Effect */}
              <div className="absolute inset-0 bg-gradient-primary opacity-5 animate-gradient"></div>
              
              {/* Magic Particles */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full animate-float opacity-60"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-warning rounded-full animate-float opacity-80" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-success rounded-full animate-float opacity-70" style={{animationDelay: '2s'}}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <Upload className={cn(
                    "h-20 w-20 transition-all duration-500",
                    isDragActive 
                      ? "text-primary animate-bounce scale-125" 
                      : "text-primary/70 hover:text-primary hover:scale-110"
                  )} />
                </div>
                
                <div className="space-y-4">
                  <h3 className={cn(
                    "text-2xl font-bold transition-all duration-300",
                    isDragActive ? "text-primary scale-105" : "text-foreground"
                  )}>
                    {isDragActive ? '✨ Drop your files here ✨' : '🚀 Upload Your Documents'}
                  </h3>
                  
                  <p className="text-lg text-muted-foreground">
                    {isDragActive ? 'Release to upload' : 'Drag & drop or click to select files'}
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    <span className="px-4 py-2 bg-success/20 text-success rounded-full text-sm font-medium border border-success/30">
                      📄 PDF
                    </span>
                    <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium border border-primary/30">
                      📝 Word
                    </span>
                    <span className="px-4 py-2 bg-warning/20 text-warning rounded-full text-sm font-medium border border-warning/30">
                      🖼️ Images
                    </span>
                    <span className="px-4 py-2 bg-purple-500/20 text-purple-500 rounded-full text-sm font-medium border border-purple-500/30">
                      📋 Text
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-full px-6 py-3 inline-block backdrop-blur-sm border border-muted/50">
                    ⚡ Max 10MB per file • 🤖 AI Analysis Included • 🔒 Secure Upload
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced File List */}
            {filesWithProgress.length > 0 && (
              <div className="space-y-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gradient">Processing Queue</h3>
                  <div className="flex-1 h-px bg-gradient-primary opacity-30"></div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {filesWithProgress.length} files
                  </span>
                </div>
                
                <div className="grid gap-4">
                  {filesWithProgress.map((fileWithProgress, index) => (
                    <div
                      key={fileWithProgress.id}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-primary/20 shadow-soft hover-lift animate-scale-in"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      {/* Animated Border */}
                      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-xl group-hover:opacity-40 transition-all duration-500"></div>
                      
                      <div className="relative p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          {/* Enhanced File Icon */}
                          <div className={cn(
                            "flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300",
                            fileWithProgress.status === 'completed' ? "bg-success/20 text-success" :
                            fileWithProgress.status === 'uploading' ? "bg-primary/20 text-primary animate-pulse" :
                            fileWithProgress.status === 'error' ? "bg-destructive/20 text-destructive" :
                            "bg-muted/20 text-muted-foreground"
                          )}>
                            {fileWithProgress.status === 'completed' ? (
                              <CheckCircle className="h-8 w-8" />
                            ) : (
                              getFileIcon(fileWithProgress.file)
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                {fileWithProgress.file.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                                  {formatFileSize(fileWithProgress.file.size)}
                                </span>
                                {fileWithProgress.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(fileWithProgress.id)}
                                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Status Display */}
                            {fileWithProgress.status === 'uploading' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-primary font-medium">Uploading...</span>
                                  <span className="text-primary font-bold">{fileWithProgress.progress}%</span>
                                </div>
                                <Progress 
                                  value={fileWithProgress.progress} 
                                  className="h-3 bg-primary/10"
                                />
                              </div>
                            )}
                            
                            {fileWithProgress.status === 'completed' && (
                              <div className="flex items-center gap-2 text-success font-medium animate-bounce-in">
                                <CheckCircle className="h-4 w-4" />
                                <span>Upload complete! Ready for AI analysis</span>
                                <div className="flex gap-1">
                                  <Star className="h-3 w-3 fill-current" />
                                  <Star className="h-3 w-3 fill-current" />
                                  <Star className="h-3 w-3 fill-current" />
                                </div>
                              </div>
                            )}
                            
                            {fileWithProgress.status === 'error' && (
                              <div className="flex items-center gap-2 text-destructive font-medium">
                                <X className="h-4 w-4" />
                                <span>Upload failed - Please try again</span>
                              </div>
                            )}
                            
                            {fileWithProgress.status === 'pending' && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>
                                <span>Waiting to upload...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Upload Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading || filesWithProgress.every(f => f.status !== 'pending')}
                    size="lg"
                    className={cn(
                      "relative overflow-hidden px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-500 hover-glow",
                      "bg-gradient-primary hover:bg-gradient-primary shadow-colored hover:shadow-glow",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-3">
                      {isUploading ? (
                        <>
                          <Upload className="h-6 w-6 animate-spin" />
                          <span>Processing Magic... ✨</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-6 w-6" />
                          <span>Launch Upload 🚀</span>
                          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                            {filesWithProgress.filter(f => f.status === 'pending').length}
                          </span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;