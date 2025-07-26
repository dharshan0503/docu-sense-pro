import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileApi, type FileUpload, type FeedbackData } from '@/lib/api';

interface FeedbackFormProps {
  file: FileUpload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ file, open, onOpenChange }) => {
  const [feedbackType, setFeedbackType] = useState<'summary' | 'classification'>('summary');
  const [correctValue, setCorrectValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correctValue.trim()) {
      toast({
        title: "Error",
        description: "Please provide the correct value",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData: FeedbackData = {
        fileId: file.id,
        type: feedbackType,
        correctValue: correctValue.trim(),
        reason: reason.trim() || undefined,
      };

      await fileApi.submitFeedback(feedbackData);
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It will help improve our AI models.",
      });
      
      // Reset form
      setCorrectValue('');
      setReason('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCorrectValue('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provide Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{file.filename}</p>
            <p className="text-xs text-muted-foreground">
              Help us improve AI accuracy for this file
            </p>
          </div>

          {/* Feedback Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What would you like to correct?</Label>
            <RadioGroup 
              value={feedbackType} 
              onValueChange={(value) => setFeedbackType(value as 'summary' | 'classification')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="text-sm">
                  Summary is incorrect
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="classification" id="classification" />
                <Label htmlFor="classification" className="text-sm">
                  Classification is wrong
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Current Value Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Current {feedbackType === 'summary' ? 'Summary' : 'Classification'}:
            </Label>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                {feedbackType === 'summary' 
                  ? (file.summary || 'No summary available') 
                  : (file.classification || 'No classification available')
                }
              </p>
            </div>
          </div>

          {/* Correct Value */}
          <div className="space-y-2">
            <Label htmlFor="correctValue" className="text-sm font-medium">
              Correct {feedbackType === 'summary' ? 'Summary' : 'Classification'} *
            </Label>
            {feedbackType === 'summary' ? (
              <Textarea
                id="correctValue"
                placeholder="Please provide the correct summary..."
                value={correctValue}
                onChange={(e) => setCorrectValue(e.target.value)}
                rows={3}
                required
              />
            ) : (
              <Input
                id="correctValue"
                placeholder="e.g., Invoice, Contract, Letter..."
                value={correctValue}
                onChange={(e) => setCorrectValue(e.target.value)}
                required
              />
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Why do you think the AI got this wrong? Any additional context..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !correctValue.trim()}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;