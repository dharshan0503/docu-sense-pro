-- Add user_id column to documents table
ALTER TABLE public.documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);