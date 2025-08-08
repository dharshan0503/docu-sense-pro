import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Text chunking functionality
function chunkText(text: string, chunkSize = 3000, chunkOverlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - chunkOverlap;
    if (start >= text.length - chunkOverlap) break;
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, content, fileName, mimeType } = await req.json();
    
    if (!fileId || !content) {
      throw new Error('Missing required fields: fileId and content');
    }

    console.log(`Analyzing document: ${fileName} (${fileId})`);

    // Get configuration
    const ollamaUrl = Deno.env.get('OLLAMA_URL') || 'http://localhost:11434';
    const ollamaModel = Deno.env.get('OLLAMA_MODEL') || 'llama3.2';
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Prefer Ollama, fallback to OpenAI
    const useOllama = ollamaUrl !== 'disabled';

    // Enhanced analysis functions
    const analyzeWithOllama = async (content: string, fileName: string, mimeType: string) => {
      const fileTypeContext = mimeType.includes('pdf') ? 'PDF document' :
                             mimeType.includes('text') ? 'text document' :
                             mimeType.includes('image') ? 'image document' :
                             'document';
      
      const prompt = `Analyze this ${fileTypeContext} titled "${fileName}" and extract key information.

Document Content:
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (content truncated)' : ''}

Provide a JSON response with these exact keys:
- summary: A concise 2-3 sentence summary
- key_points: Array of 3-5 most important points
- document_type: One of: report, contract, invoice, letter, presentation, technical_doc, academic, legal, financial, other
- confidence: Float between 0.0 and 1.0
- topics: Array of 2-4 main topics/themes
- metadata: Object with dates, names, amounts, and other key info extracted from the document

Return only valid JSON:`;

      const requestBody = {
        model: ollamaModel,
        prompt: prompt,
        format: "json",
        stream: false,
        options: {
          temperature: 0.3,
          num_ctx: 4096
        }
      };

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const result = await response.json();
      return JSON.parse(result.response);
    };

    const analyzeWithOpenAI = async (content: string, fileName: string, mimeType: string) => {
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const fileTypeContext = mimeType.includes('pdf') ? 'PDF document' :
                             mimeType.includes('text') ? 'text document' :
                             mimeType.includes('image') ? 'image document' :
                             'document';
      
      const prompt = `Analyze this ${fileTypeContext} titled "${fileName}" and provide:

1. SUMMARY: A concise 2-3 sentence summary of the main content
2. KEY_POINTS: List 3-5 most important points or findings
3. DOCUMENT_TYPE: Classify as one of: report, contract, invoice, letter, presentation, technical_doc, academic, legal, financial, other
4. CONFIDENCE: Rate your analysis confidence from 0.0 to 1.0
5. TOPICS: List 2-4 main topics/themes
6. METADATA: Extract key dates, names, amounts, and other important data

Content to analyze:
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (content truncated)' : ''}

Format your response as JSON with these exact keys: summary, key_points, document_type, confidence, topics, metadata`;

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
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const analysisText = aiResponse.choices[0].message.content;
      return JSON.parse(analysisText);
    };

    // Perform AI analysis with fallback strategy
    let analysis;
    let analysisMethod = 'fallback';
    
    try {
      if (useOllama) {
        console.log('Attempting Ollama analysis...');
        analysis = await analyzeWithOllama(content, fileName, mimeType);
        analysisMethod = 'ollama';
        console.log('Ollama analysis successful');
      } else if (openAIApiKey) {
        console.log('Using OpenAI analysis...');
        analysis = await analyzeWithOpenAI(content, fileName, mimeType);
        analysisMethod = 'openai';
        console.log('OpenAI analysis successful');
      } else {
        throw new Error('No AI service available');
      }
    } catch (primaryError) {
      console.error(`Primary analysis method (${useOllama ? 'Ollama' : 'OpenAI'}) failed:`, primaryError);
      
      // Try fallback method
      try {
        if (useOllama && openAIApiKey) {
          console.log('Falling back to OpenAI...');
          analysis = await analyzeWithOpenAI(content, fileName, mimeType);
          analysisMethod = 'openai_fallback';
        } else if (!useOllama && ollamaUrl !== 'disabled') {
          console.log('Falling back to Ollama...');
          analysis = await analyzeWithOllama(content, fileName, mimeType);
          analysisMethod = 'ollama_fallback';
        } else {
          throw new Error('No fallback available');
        }
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError);
        // Final fallback to basic analysis
        analysis = {
          summary: `Document "${fileName}" has been uploaded and basic processing completed. Manual review recommended for detailed analysis.`,
          key_points: [
            "Document uploaded successfully",
            "File type detected: " + mimeType,
            "Content length: " + content.length + " characters",
            "Manual review recommended for detailed insights"
          ],
          document_type: mimeType.includes('pdf') ? 'report' : 
                         mimeType.includes('image') ? 'other' : 'other',
          confidence: 0.3,
          topics: ["document_processing", "file_upload"],
          metadata: {
            file_name: fileName,
            file_type: mimeType,
            processed_at: new Date().toISOString(),
            processing_method: "basic_fallback"
          }
        };
        analysisMethod = 'basic_fallback';
      }
    }

    console.log(`Analysis completed using: ${analysisMethod}`);

    // Initialize Supabase client
    const supabaseUrl = 'https://hvhfxcwazrpfboetzkve.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aGZ4Y3dhenJwZmJvZXR6a3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTMwODksImV4cCI6MjA2OTI2OTA4OX0.ckxXYelSrkRfAmJxOT4huUgDJyeQYr4-cUre1ucPN64';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update file record with enhanced analysis
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: analysis.summary,
        doc_type: analysis.document_type,
        confidence: analysis.confidence,
        entities: {
          key_points: analysis.key_points,
          topics: analysis.topics,
          metadata: analysis.metadata || {},
          analyzed_at: new Date().toISOString(),
          analysis_method: analysisMethod,
          content_preview: content.substring(0, 500)
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
          topics: analysis.topics,
          metadata: analysis.metadata || {},
          analysis_method: analysisMethod
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