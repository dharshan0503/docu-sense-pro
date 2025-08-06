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
    const { fileId, content, fileName, mimeType } = await req.json();
    
    if (!fileId || !content) {
      throw new Error('Missing required fields: fileId and content');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Analyzing document: ${fileName} (${fileId})`);

    // Create prompt based on file type
    const getAnalysisPrompt = (content: string, fileName: string, mimeType: string) => {
      const fileTypeContext = mimeType.includes('pdf') ? 'PDF document' :
                             mimeType.includes('text') ? 'text document' :
                             mimeType.includes('image') ? 'image document' :
                             'document';
      
      return `Analyze this ${fileTypeContext} titled "${fileName}" and provide:

1. SUMMARY: A concise 2-3 sentence summary of the main content
2. KEY_POINTS: List 3-5 most important points or findings
3. DOCUMENT_TYPE: Classify as one of: report, contract, invoice, letter, presentation, technical_doc, academic, legal, financial, other
4. CONFIDENCE: Rate your analysis confidence from 0.0 to 1.0
5. TOPICS: List 2-4 main topics/themes

Content to analyze:
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (content truncated)' : ''}

Format your response as JSON with these exact keys: summary, key_points, document_type, confidence, topics`;
    };

    // Call OpenAI API
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
            content: 'You are a document analysis expert. Analyze documents and provide structured insights in JSON format. Be accurate and concise.'
          },
          {
            role: 'user',
            content: getAnalysisPrompt(content, fileName, mimeType)
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    console.log('Raw AI response:', analysisText);

    // Parse AI response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback analysis
      analysis = {
        summary: "Document analysis completed, but formatting was unclear.",
        key_points: ["Content analysis performed", "Manual review recommended"],
        document_type: "other",
        confidence: 0.5,
        topics: ["general_content"]
      };
    }

    // Initialize Supabase client
    const supabaseUrl = 'https://hvhfxcwazrpfboetzkve.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aGZ4Y3dhenJwZmJvZXR6a3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTMwODksImV4cCI6MjA2OTI2OTA4OX0.ckxXYelSrkRfAmJxOT4huUgDJyeQYr4-cUre1ucPN64';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update file record with analysis
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: analysis.summary,
        doc_type: analysis.document_type,
        confidence: analysis.confidence,
        entities: {
          key_points: analysis.key_points,
          topics: analysis.topics,
          analyzed_at: new Date().toISOString()
        },
        status: 'uploaded'
      })
      .eq('file_id', fileId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to save analysis to database');
    }

    console.log(`Successfully analyzed and updated file: ${fileId}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          summary: analysis.summary,
          key_points: analysis.key_points,
          document_type: analysis.document_type,
          confidence: analysis.confidence,
          topics: analysis.topics
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-document function:', error);
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