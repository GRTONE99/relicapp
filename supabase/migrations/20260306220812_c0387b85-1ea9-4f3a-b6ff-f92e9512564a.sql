-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create collection_items table
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player TEXT DEFAULT '',
  team TEXT DEFAULT '',
  sport TEXT DEFAULT '',
  year TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sub_category TEXT DEFAULT '',
  condition TEXT DEFAULT '',
  grade TEXT DEFAULT '',
  grading_company TEXT DEFAULT '',
  certification_number TEXT DEFAULT '',
  authentication_company TEXT DEFAULT '',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  recent_sale_price NUMERIC NOT NULL DEFAULT 0,
  storage_location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  date_acquired TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  collection_id TEXT DEFAULT '1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own items" ON public.collection_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own items" ON public.collection_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.collection_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.collection_items FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_collection_items_updated_at
  BEFORE UPDATE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for item photos
INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', true);

CREATE POLICY "Item photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'item-photos');
CREATE POLICY "Users can upload item photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their item photos" ON storage.objects FOR DELETE USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);