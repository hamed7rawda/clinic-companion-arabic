
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('doctor', 'nurse', 'reception');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
$$;

CREATE POLICY "users_view_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "doctors_manage_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'doctor')) WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_view_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  -- First user gets doctor role, others get reception by default
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'doctor');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'reception');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID,
  patient_name TEXT NOT NULL,
  appointment_id UUID,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_auth_all" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_items_auth_all" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_auth_all" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ NOTIFICATIONS LOG ============
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  patient_name TEXT,
  message TEXT,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_auth_all" ON public.notifications_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ N8N WEBHOOKS CONFIG ============
CREATE TABLE public.n8n_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.n8n_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_auth_all" ON public.n8n_webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ TIGHTEN EXISTING TABLES (auth required) ============
DROP POLICY IF EXISTS public_all_appointments ON public.appointments;
DROP POLICY IF EXISTS public_all_patients ON public.patients;
DROP POLICY IF EXISTS public_all_queue ON public.queue;
DROP POLICY IF EXISTS public_all_medical_history ON public.medical_history;
DROP POLICY IF EXISTS public_all_prescriptions ON public.prescriptions;
DROP POLICY IF EXISTS public_all_clinic_config ON public.clinic_config;
DROP POLICY IF EXISTS public_all_activity_log ON public.activity_log;
DROP POLICY IF EXISTS public_all_workflow_runs ON public.workflow_runs;

CREATE POLICY "appointments_auth_all" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "patients_auth_all" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "queue_auth_all" ON public.queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "medical_history_auth_all" ON public.medical_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prescriptions_auth_all" ON public.prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clinic_config_auth_all" ON public.clinic_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "activity_log_auth_all" ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "workflow_runs_auth_all" ON public.workflow_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_webhooks_updated BEFORE UPDATE ON public.n8n_webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICE NUMBER GENERATOR ============
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'INV-' || to_char(now(), 'YYYYMM') || '-' || nextval('invoice_number_seq');
END; $$;
