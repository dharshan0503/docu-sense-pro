import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Trash2, Eye, MoreHorizontal, FileText, Image, File, Download, Calendar, Star, Sparkles, Grid3X3, List, SortAsc, Archive, Brain, Zap } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'confidence'>('date');
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

  // Add real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          // Reload files when any change occurs
          loadFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.filename.localeCompare(b.filename));
      case 'date':
        return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'size':
        return sorted.sort((a, b) => b.size - a.size);
      case 'confidence':
        return sorted.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      default:
        return sorted;
    }
  }, [filteredFiles, sortBy]);

  const getFileIcon = (file: FileUpload) => {
    if (file.type?.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (file.type?.startsWith('image/')) return <Image className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

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
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-success/20 to-success/10 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-success font-medium text-xs">Uploaded</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/30">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <span className="text-warning font-medium text-xs">Processing</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <span className="text-destructive font-medium text-xs">Failed</span>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percentage = Math.round(confidence * 100);
    const radius = 16;
    const strokeWidth = 3;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    let colorClass = '';
    let bgClass = '';
    let textClass = '';
    let stars = '';
    
    if (percentage >= 95) {
      colorClass = 'stroke-success';
      bgClass = 'bg-gradient-to-r from-success/20 to-success/10';
      textClass = 'text-success';
      stars = '⭐⭐⭐';
    } else if (percentage >= 90) {
      colorClass = 'stroke-success';
      bgClass = 'bg-gradient-to-r from-success/15 to-success/5';
      textClass = 'text-success';
      stars = '⭐⭐';
    } else if (percentage >= 70) {
      colorClass = 'stroke-warning';
      bgClass = 'bg-gradient-to-r from-warning/20 to-warning/10';
      textClass = 'text-warning';
      stars = '⭐';
    } else {
      colorClass = 'stroke-destructive';
      bgClass = 'bg-gradient-to-r from-destructive/20 to-destructive/10';
      textClass = 'text-destructive';
      stars = '⚠️';
    }
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgClass} ${textClass}`}>
        <div className="relative w-8 h-8">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className={`${colorClass} opacity-80`}
            />
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="opacity-20"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{percentage}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">AI Confidence</span>
          <span className="text-xs">{stars}</span>
        </div>
      </div>
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
    <div className="w-full space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl glass-effect border border-primary/20">
        <div className="absolute inset-0 bg-gradient-hero animate-gradient opacity-10"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <Archive className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Document Library</h1>
                <p className="text-muted-foreground">Intelligent file management with AI insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-4 py-2 text-lg bg-primary/10 text-primary border-primary/30">
                <Brain className="h-4 w-4 mr-2" />
                {sortedFiles.length} files
              </Badge>
              
              <div className="flex items-center bg-muted/30 rounded-xl p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-lg"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="🔍 Search files, summaries, classifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg rounded-2xl border-primary/20 bg-background/50 backdrop-blur-sm"
              />
            </div>
            
            <div className="lg:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-background/50 backdrop-blur-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border border-primary/20">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="uploaded">✅ Uploaded</SelectItem>
                  <SelectItem value="processing">⚡ Processing</SelectItem>
                  <SelectItem value="failed">❌ Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="lg:col-span-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-background/50 backdrop-blur-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border border-primary/20">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">📄 PDF</SelectItem>
                  <SelectItem value="doc">📝 Documents</SelectItem>
                  <SelectItem value="image">🖼️ Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="lg:col-span-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-background/50 backdrop-blur-sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border border-primary/20">
                  <SelectItem value="date">📅 Date</SelectItem>
                  <SelectItem value="name">🔤 Name</SelectItem>
                  <SelectItem value="size">📏 Size</SelectItem>
                  <SelectItem value="confidence">⭐ Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="lg:col-span-1 flex justify-end">
              <Button 
                size="lg" 
                className="h-12 w-12 p-0 rounded-2xl bg-gradient-primary hover:bg-gradient-primary shadow-colored hover:shadow-glow"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className={cn(
            "gap-6",
            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
          )}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={cn(
                  "rounded-2xl bg-gradient-card border border-primary/10",
                  viewMode === 'grid' ? "h-48 p-6" : "h-24 p-4"
                )}>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4 animate-shimmer"></div>
                    <div className="h-3 bg-muted rounded w-1/2 animate-shimmer"></div>
                    <div className="h-3 bg-muted rounded w-2/3 animate-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-6">
              <Archive className="h-12 w-12 text-primary/50" />
            </div>
            <h3 className="text-2xl font-bold text-muted-foreground mb-2">No files found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? "Try adjusting your search criteria or filters"
                : "Upload your first document to get started with AI-powered analysis"
              }
            </p>
          </div>
        ) : (
          <div className={cn(
            "gap-6",
            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
          )}>
            {sortedFiles.map((file, index) => (
              <div
                key={file.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-500 cursor-pointer hover-lift animate-scale-in",
                  viewMode === 'grid' 
                    ? "rounded-3xl bg-gradient-card border border-primary/20 shadow-soft hover:shadow-glow p-6"
                    : "rounded-2xl bg-gradient-card border border-primary/20 shadow-soft hover:shadow-colored p-4 flex items-center gap-4"
                )}
                style={{animationDelay: `${index * 50}ms`}}
                onClick={() => onFileSelect?.(file)}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                
                {viewMode === 'grid' ? (
                  /* Grid View */
                  <div className="relative z-10 h-full flex flex-col">
                    {/* File Icon & Type */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                        file.type?.includes('pdf') ? "bg-red-500/20 text-red-600" :
                        file.type?.startsWith('image/') ? "bg-blue-500/20 text-blue-600" :
                        "bg-purple-500/20 text-purple-600"
                      )}>
                        {getFileIcon(file)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(file.status)}
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 space-y-3">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {file.filename}
                      </h3>
                      
                      {file.classification && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                            {file.classification}
                          </Badge>
                        </div>
                      )}
                      
                      {file.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {file.summary}
                        </p>
                      )}
                      
                      {file.confidence && (
                        <div className="flex items-center justify-center">
                          {getConfidenceBadge(file.confidence)}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(file.timestamp)}
                        </div>
                        <div>{formatFileSize(file.size)}</div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFileSelect?.(file);
                          }}
                          className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary rounded-xl"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary rounded-xl"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border border-primary/20">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(file);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
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
                ) : (
                  /* List View */
                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      file.type?.includes('pdf') ? "bg-red-500/20 text-red-600" :
                      file.type?.startsWith('image/') ? "bg-blue-500/20 text-blue-600" :
                      "bg-purple-500/20 text-purple-600"
                    )}>
                      {getFileIcon(file)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {file.filename}
                        </h3>
                        {getStatusBadge(file.status)}
                        {file.classification && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                            {file.classification}
                          </Badge>
                        )}
                      </div>
                      
                      {file.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                          {file.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(file.timestamp)}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {file.confidence && getConfidenceBadge(file.confidence)}
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFileSelect?.(file);
                          }}
                          className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary rounded-xl"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary rounded-xl"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm border border-primary/20">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(file);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;