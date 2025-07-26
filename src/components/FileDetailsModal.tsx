import React, { useState, useEffect } from 'react';
import { X, FileText, Clock, Tag, Download, MessageSquare, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { fileApi, type FileUpload, type FileDetails } from '@/lib/api';
import FeedbackForm from './FeedbackForm';

interface FileDetailsModalProps {
  file: FileUpload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FileDetailsModal: React.FC<FileDetailsModalProps> = ({ 
  file, 
  open, 
  onOpenChange 
}) => {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file && open) {
      loadFileDetails();
    }
  }, [file, open]);

  const loadFileDetails = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const details = await fileApi.getFileDetails(file.id);
      setFileDetails(details);
    } catch (error) {
      console.error('Failed to load file details:', error);
      toast({
        title: "Error",
        description: "Failed to load file details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">🟢 Uploaded</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-processing/10 text-processing border-processing/20">🟡 Processing</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">🔴 Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percentage = Math.round(confidence * 100);
    let className = '';
    
    if (percentage >= 90) {
      className = 'bg-success/10 text-success border-success/20';
    } else if (percentage >= 70) {
      className = 'bg-warning/10 text-warning border-warning/20';
    } else {
      className = 'bg-destructive/10 text-destructive border-destructive/20';
    }
    
    return (
      <Badge variant="outline" className={className}>
        {percentage}% confidence
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            {file.filename}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Status and Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>File Information</span>
                    <div className="flex gap-2">
                      {getStatusBadge(fileDetails?.status || file.status)}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File Name</p>
                      <p className="text-sm">{file.filename}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File Size</p>
                      <p className="text-sm">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Upload Date</p>
                      <p className="text-sm">{formatDate(file.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File Type</p>
                      <p className="text-sm">{file.type || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  {fileDetails?.processingTime && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fileDetails.processingTime}s
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFeedback(true)}
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Provide Feedback
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              {/* AI Summary */}
              {file.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>AI Summary</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFeedback(true)}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{file.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Classification */}
              {file.classification && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Document Classification</span>
                      <div className="flex gap-2">
                        {getConfidenceBadge(file.confidence)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFeedback(true)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <Badge variant="secondary" className="text-sm">
                        {file.classification}
                      </Badge>
                    </div>
                    {file.confidence && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Confidence: {Math.round(file.confidence * 100)}%
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Content Preview */}
              {fileDetails?.content && (
                <Card>
                  <CardHeader>
                    <CardTitle>Content Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {fileDetails.content.substring(0, 1000)}
                        {fileDetails.content.length > 1000 && '...'}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File ID</p>
                      <p className="text-sm font-mono">{file.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">MIME Type</p>
                      <p className="text-sm">{file.type || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  {fileDetails?.metadata && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Additional Metadata
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="text-xs">
                            {JSON.stringify(fileDetails.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Feedback Form */}
        {showFeedback && file && (
          <FeedbackForm
            file={file}
            open={showFeedback}
            onOpenChange={setShowFeedback}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileDetailsModal;