-- Create clients table for managing COA client information
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  license_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint on name to prevent duplicates
CREATE UNIQUE INDEX clients_name_unique ON public.clients (name);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
-- Allow anonymous users to read clients
CREATE POLICY "Allow anonymous read access" ON public.clients
FOR SELECT TO anon
USING (true);

-- Allow anonymous users to insert clients
CREATE POLICY "Allow anonymous insert access" ON public.clients
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anonymous users to update clients
CREATE POLICY "Allow anonymous update access" ON public.clients
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to delete clients
CREATE POLICY "Allow anonymous delete access" ON public.clients
FOR DELETE TO anon
USING (true);

-- Insert default client (Flora Distribution Group LLC)
INSERT INTO public.clients (name, address, license_number)
VALUES (
  'Flora Distribution Group LLC',
  '4111 E Rose Lake Dr' || E'\n' || 'Charlotte, NC 28217',
  'USDA_37_0979'
)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

