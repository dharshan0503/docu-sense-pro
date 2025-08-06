import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, feedbackType, correctValue, reason, userId } = await req.json();
    
    if (!fileId || !feedbackType || !userId) {
      throw new Error('Missing required fields');
    }

    console.log(`Processing feedback for file ${fileId} from user ${userId}`);

    // Initialize Supabase client
    const supabaseUrl = 'https://hvhfxcwazrpfboetzkve.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aGZ4Y3dhenJwZmJvZXR6a3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTMwODksImV4cCI6MjA2OTI2OTA4OX0.ckxXYelSrkRfAmJxOT4huUgDJyeQYr4-cUre1ucPN64';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current file data
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      throw new Error('File not found');
    }

    // Store feedback for learning
    const feedbackRecord = {
      file_id: fileId,
      user_id: userId,
      feedback_type: feedbackType,
      original_value: feedbackType === 'summary' ? fileData.ai_summary : fileData.document_classification,
      correct_value: correctValue,
      reason: reason,
      created_at: new Date().toISOString()
    };

    // If we want to improve the AI with feedback, we could use OpenAI here
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAIApiKey && correctValue) {
      try {
        console.log('Reprocessing with feedback...');
        
        const improvePrompt = feedbackType === 'summary' 
          ? `The previous summary was: "${fileData.ai_summary}". User feedback indicates the correct summary should be: "${correctValue}". Reason: "${reason}". Please provide an improved summary for this document.`
          : `The previous classification was: "${fileData.document_classification}". User feedback indicates the correct classification should be: "${correctValue}". Reason: "${reason}". Please provide an improved classification.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a document analysis expert. Learn from user feedback and provide improved analysis.'
              },
              {
                role: 'user',
                content: improvePrompt + `\n\nOriginal content: ${fileData.content_preview}`
              }
            ],
            temperature: 0.2,
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const improvedValue = aiResponse.choices[0].message.content;

          // Update the file with improved analysis
          const updateData = feedbackType === 'summary' 
            ? { ai_summary: improvedValue }
            : { document_classification: improvedValue };

          await supabase
            .from('files')
            .update({
              ...updateData,
              confidence_score: Math.min(1.0, (fileData.confidence_score || 0.5) + 0.1), // Slightly increase confidence
              metadata: {
                ...fileData.metadata,
                feedback_applied: true,
                last_updated: new Date().toISOString()
              }
            })
            .eq('id', fileId);

          console.log('Successfully updated file with improved analysis');
        }
      } catch (aiError) {
        console.error('Error improving with AI:', aiError);
        // Continue with feedback storage even if AI improvement fails
      }
    }

    console.log('Feedback processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback processed and analysis improved' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-feedback function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});