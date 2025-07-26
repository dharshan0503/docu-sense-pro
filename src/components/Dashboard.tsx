import React, { useState } from 'react';
import { Upload, BarChart3, FileText, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileUpload from './FileUpload';
import FileList from './FileList';
import FileDetailsModal from './FileDetailsModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import { type FileUpload as FileUploadType } from '@/lib/api';

const Dashboard: React.FC = () => {
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
      <div className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Document Manager
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered document processing and management platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success">
                <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                System Online
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                v2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              File Library
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload your documents for AI-powered analysis and classification
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">✨ AI Features</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Automatic document summarization</li>
                        <li>• Intelligent classification</li>
                        <li>• Content analysis and extraction</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">📄 Supported Formats</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• PDF documents</li>
                        <li>• Word documents (.doc, .docx)</li>
                        <li>• Images (PNG, JPG, GIF)</li>
                        <li>• Text files</li>
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