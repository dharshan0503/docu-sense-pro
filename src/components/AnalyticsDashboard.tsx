import React, { useState, useEffect } from 'react';
import { TrendingUp, Files, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fileApi, type Metrics } from '@/lib/api';

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const metricsData = await fileApi.getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-success';
    if (rate >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  const getSuccessRateBg = (rate: number) => {
    if (rate >= 0.9) return 'bg-success/10';
    if (rate >= 0.7) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Files */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Files className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatNumber(metrics.totalFiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time uploads
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className={`h-4 w-4 ${getSuccessRateColor(metrics.successRate)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
              {Math.round(metrics.successRate * 100)}%
            </div>
            <div className="mt-2">
              <Progress 
                value={metrics.successRate * 100} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing success rate
            </p>
          </CardContent>
        </Card>

        {/* Average Processing Time */}
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-processing" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-processing">
              {metrics.averageProcessingTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average time per file
            </p>
          </CardContent>
        </Card>

        {/* Today's Uploads */}
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Uploads</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {metrics.uploadsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Files uploaded today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success Rate Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Processing Success Rate</span>
                <Badge 
                  variant="outline" 
                  className={getSuccessRateBg(metrics.successRate)}
                >
                  {Math.round(metrics.successRate * 100)}%
                </Badge>
              </div>
              <Progress value={metrics.successRate * 100} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Failed: {Math.round((1 - metrics.successRate) * 100)}%</span>
                <span>Success: {Math.round(metrics.successRate * 100)}%</span>
              </div>
            </div>

            {/* Processing Queue */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Processing Queue</span>
                <Badge variant="outline" className="bg-processing/10 text-processing">
                  {metrics.processingQueue} files
                </Badge>
              </div>
              {metrics.processingQueue > 0 && (
                <p className="text-xs text-muted-foreground">
                  {metrics.processingQueue} file(s) currently being processed
                </p>
              )}
            </div>

            {/* Performance Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Performance</span>
                <Badge 
                  variant="outline" 
                  className={
                    metrics.averageProcessingTime < 10 
                      ? 'bg-success/10 text-success' 
                      : metrics.averageProcessingTime < 30 
                      ? 'bg-warning/10 text-warning' 
                      : 'bg-destructive/10 text-destructive'
                  }
                >
                  {metrics.averageProcessingTime < 10 ? 'Excellent' : 
                   metrics.averageProcessingTime < 30 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Average processing time: {metrics.averageProcessingTime.toFixed(1)}s
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Files Processed</span>
                <span className="font-semibold">{formatNumber(metrics.totalFiles)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Successful Uploads</span>
                <span className="font-semibold text-success">
                  {formatNumber(Math.round(metrics.totalFiles * metrics.successRate))}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Failed Uploads</span>
                <span className="font-semibold text-destructive">
                  {formatNumber(Math.round(metrics.totalFiles * (1 - metrics.successRate)))}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Today's Activity</span>
                <span className="font-semibold">{metrics.uploadsToday} uploads</span>
              </div>
            </div>

            {/* System Health Indicator */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-success">Operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;