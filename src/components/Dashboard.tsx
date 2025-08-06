import React, { useState } from 'react';
import { Upload, BarChart3, FileText, Settings, LogOut, User, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileUpload from './FileUpload';
import FileList from './FileList';
import FileDetailsModal from './FileDetailsModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import ExtractedDataViewer from './ExtractedDataViewer';
import { type FileUpload as FileUploadType } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState<FileUploadType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('files');

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    // Optionally switch to files tab after upload
    setActiveTab('files');
  };

  const handleFileSelect = (file: FileUploadType) => {
    setSelectedFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-card border-b shadow-strong backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-float">
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-pulse-glow">
                Document Manager
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                AI-powered document processing and management platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/20 text-success border-success/30 shadow-success hover-lift">
                <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                System Online
              </Badge>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 shadow-colored hover-lift">
                <User className="w-3 h-3 mr-1" />
                {user?.email}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              File Library
            </TabsTrigger>
            <TabsTrigger value="extracted" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Extracted Data
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-colored hover-lift gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="h-6 w-6 text-primary" />
                    Upload Documents
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Upload your documents for AI-powered analysis and classification
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="mt-6 hover-lift gradient-card border-success/20">
                <CardHeader>
                  <CardTitle className="text-xl bg-gradient-success bg-clip-text text-transparent">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        ✨ AI Features
                      </h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Automatic document summarization
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Intelligent classification
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          Content analysis and extraction
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-success flex items-center gap-2">
                        📄 Supported Formats
                      </h4>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                          PDF documents
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                          Word documents (.doc, .docx)
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                          Images (PNG, JPG, GIF)
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                          Text files
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <FileList 
              refreshTrigger={refreshTrigger}
              onFileSelect={handleFileSelect}
            />
          </TabsContent>

          <TabsContent value="extracted" className="space-y-6">
            <ExtractedDataViewer />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* File Details Modal */}
      <FileDetailsModal
        file={selectedFile}
        open={!!selectedFile}
        onOpenChange={(open) => !open && setSelectedFile(null)}
      />
    </div>
  );
};

export default Dashboard;