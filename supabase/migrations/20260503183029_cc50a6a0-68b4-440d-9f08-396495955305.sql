ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS medical_history text;