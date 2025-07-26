import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { fileApi, type FileUpload } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileListProps {
  refreshTrigger?: number;
  onFileSelect?: (file: FileUpload) => void;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger, onFileSelect }) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await fileApi.getFiles({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger, searchQuery, statusFilter, typeFilter]);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = !searchQuery || 
        file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.classification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
      
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'pdf' && file.type?.includes('pdf')) ||
        (typeFilter === 'doc' && (file.type?.includes('word') || file.type?.includes('document'))) ||
        (typeFilter === 'image' && file.type?.startsWith('image/'));
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [files, searchQuery, statusFilter, typeFilter]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileApi.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
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
      month: 'short',
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

  return (
    <Card className="w-full gradient-card shadow-colored">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Document Library</span>
          <Badge variant="outline" className="bg-muted">
            {filteredFiles.length} file(s)
          </Badge>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search files, summaries, classifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">Documents</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No files found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "p-5 border rounded-xl transition-all cursor-pointer hover-lift group",
                  "bg-gradient-card hover:shadow-colored border-border/50 hover:border-primary/30"
                )}
                onClick={() => onFileSelect?.(file)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{file.filename}</h3>
                      {getStatusBadge(file.status)}
                      {file.classification && (
                        <Badge variant="secondary">{file.classification}</Badge>
                      )}
                      {getConfidenceBadge(file.confidence)}
                    </div>
                    
                    {file.summary && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {file.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(file.timestamp)}</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect?.(file);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onFileSelect?.(file);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileList;