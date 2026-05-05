-- Add 'patient' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'patient';

-- Consultations table for draft + approved prescriptions
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  transcript TEXT,
  diagnosis TEXT,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  labs JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  audio_duration INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY consultations_auth_all ON public.consultations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public (anon) read access by patient phone lookup for the public records page.
-- We restrict by requiring a phone filter in the query (anon can SELECT but rows are
-- typically filtered by phone in code). For better security, expose a SECURITY DEFINER function:
CREATE OR REPLACE FUNCTION public.get_patient_records(_phone TEXT)
RETURNS TABLE (
  kind TEXT,
  id UUID,
  patient_name TEXT,
  date TIMESTAMPTZ,
  diagnosis TEXT,
  medications JSONB,
  labs JSONB,
  recommendations TEXT,
  status TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'consultation'::text, c.id, c.patient_name, c.created_at, c.diagnosis, c.medications, c.labs, c.recommendations, c.status
  FROM public.consultations c
  JOIN public.patients p ON p.id = c.patient_id
  WHERE p.phone = _phone AND c.status = 'approved'
  ORDER BY c.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_patient_records(TEXT) TO anon, authenticated;

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();