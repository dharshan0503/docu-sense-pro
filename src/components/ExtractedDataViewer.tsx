import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, FileText, Tag, TrendingUp, Clock } from 'lucide-react';
import { fileApi } from '@/lib/api';

interface ExtractedData {
  id: string;
  filename: string;
  summary: string;
  classification: string;
  confidence: number;
  keyPoints: string[];
  topics: string[];
  timestamp: string;
  metadata?: any;
  contentPreview?: string;
  analysisMethod?: string;
  fileSize?: number;
}

const ExtractedDataViewer = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractedData();
  }, []);

  const loadExtractedData = async () => {
    try {
      const files = await fileApi.getFiles();
      const processedFiles = files
        .filter(file => file.status === 'uploaded' && file.summary)
        .map(file => ({
          id: file.id,
          filename: file.filename,
          summary: file.summary || '',
          classification: file.classification || 'Unknown',
          confidence: file.confidence || 0,
          keyPoints: file.entities?.key_points || [],
          topics: file.entities?.topics || [],
          timestamp: file.timestamp
        }));
      
      setExtractedData(processedFiles);
    } catch (error) {
      console.error('Failed to load extracted data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Extracted Important Data</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (extractedData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Extracted Important Data</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No Processed Documents</h3>
              <p className="text-muted-foreground">
                Upload documents to see AI-extracted important information here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Extracted Important Data</h2>
        <Badge variant="outline" className="ml-auto">
          {extractedData.length} documents processed
        </Badge>
      </div>

      <div className="grid gap-6">
        {extractedData.map((data) => (
          <Card key={data.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {data.filename}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(data.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round(data.confidence * 100)}% confidence
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${getConfidenceColor(data.confidence)}`}
                    title={`Confidence: ${Math.round(data.confidence * 100)}%`}
                  />
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {data.classification}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* AI Summary */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.summary}
                </p>
              </div>

              <Separator />

              {/* Key Points */}
              {data.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {data.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Topics */}
              {data.topics.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExtractedDataViewer;