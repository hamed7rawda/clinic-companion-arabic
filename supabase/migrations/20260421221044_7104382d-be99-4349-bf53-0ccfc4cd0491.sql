
-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT,
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  allergies TEXT,
  register_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT,
  patient_name TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  complaint TEXT,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','completed','cancelled','rescheduled')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  follow_up_sent BOOLEAN NOT NULL DEFAULT false,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queue table
CREATE TABLE public.queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  join_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','called','done')),
  position INTEGER NOT NULL
);

-- Medical history
CREATE TABLE public.medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis TEXT,
  prescriptions TEXT,
  follow_up_status TEXT NOT NULL DEFAULT 'pending' CHECK (follow_up_status IN ('pending','sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  reminder_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinic config (singleton)
CREATE TABLE public.clinic_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  doctor_name TEXT,
  specialty TEXT,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  slots_per_day INTEGER DEFAULT 20,
  doctor_chat_id TEXT,
  nurse_chat_id TEXT,
  google_sheet_id TEXT,
  reminder_morning TIME DEFAULT '08:00',
  reminder_afternoon TIME DEFAULT '14:00',
  reminder_evening TIME DEFAULT '20:00',
  telegram_status BOOLEAN DEFAULT true,
  sheets_status BOOLEAN DEFAULT true,
  openai_status BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.clinic_config (id, doctor_name, specialty)
VALUES (1, 'د. أحمد محمد', 'طب عام');

-- Activity feed
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow runs (for automation panel)
CREATE TABLE public.workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_key TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','pending')),
  next_run_at TIMESTAMPTZ
);

INSERT INTO public.workflow_runs (workflow_key, workflow_name, last_run_at, status, next_run_at) VALUES
('daily_reminder','🔔 تذكير يومي بالمواعيد', now() - interval '3 hours', 'success', (CURRENT_DATE + interval '1 day' + time '09:00')),
('daily_report','📊 التقرير اليومي', now() - interval '12 hours', 'success', (CURRENT_DATE + time '20:00')),
('medication_reminders','💊 تذكير الأدوية', now() - interval '1 hour', 'success', (CURRENT_DATE + time '14:00')),
('follow_up','🔄 رسائل المتابعة', now() - interval '2 hours', 'success', (CURRENT_DATE + interval '1 day' + time '10:00')),
('rating_requests','⭐ طلبات التقييم', now() - interval '15 minutes', 'success', (now() + interval '45 minutes'));

-- Enable RLS — open policies for clinic internal dashboard (no end-user auth)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Public access policies (clinic dashboard, no auth in this prototype)
CREATE POLICY "public_all_patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_queue" ON public.queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_medical_history" ON public.medical_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_clinic_config" ON public.clinic_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_workflow_runs" ON public.workflow_runs FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

ALTER TABLE public.queue REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;

-- Seed sample data
INSERT INTO public.patients (chat_id, name, age, phone, allergies) VALUES
('1001','محمد علي', 35, '0501234567', 'بنسلين'),
('1002','فاطمة الزهراء', 28, '0507654321', 'لا يوجد'),
('1003','عبدالله الحسن', 52, '0509876543', 'أسبرين'),
('1004','نورة السعيد', 41, '0501112233', 'لا يوجد'),
('1005','خالد الراشد', 65, '0504445566', 'سلفا');

INSERT INTO public.appointments (chat_id, patient_name, date, time, complaint, status, rating) VALUES
('1001','محمد علي', CURRENT_DATE, '09:00', 'صداع مستمر', 'completed', 5),
('1002','فاطمة الزهراء', CURRENT_DATE, '10:30', 'فحص دوري', 'booked', NULL),
('1003','عبدالله الحسن', CURRENT_DATE, '11:00', 'ألم في الظهر', 'booked', NULL),
('1004','نورة السعيد', CURRENT_DATE, '13:00', 'ضغط الدم', 'completed', 4),
('1005','خالد الراشد', CURRENT_DATE, '14:30', 'متابعة سكر', 'cancelled', NULL),
('1001','محمد علي', CURRENT_DATE + 1, '09:00', 'متابعة', 'booked', NULL);

INSERT INTO public.queue (patient_name, position, join_time) VALUES
('فاطمة الزهراء', 1, now() - interval '25 minutes'),
('عبدالله الحسن', 2, now() - interval '12 minutes'),
('نورة السعيد', 3, now() - interval '5 minutes');

INSERT INTO public.medical_history (patient_name, visit_date, diagnosis, prescriptions, follow_up_status) VALUES
('محمد علي', CURRENT_DATE, 'صداع توتري', 'باراسيتامول 500mg', 'sent'),
('نورة السعيد', CURRENT_DATE, 'ارتفاع ضغط طفيف', 'أملوديبين 5mg', 'pending'),
('عبدالله الحسن', CURRENT_DATE - 7, 'شد عضلي', 'مرخي عضلات', 'sent');

INSERT INTO public.prescriptions (chat_id, patient_name, medication_name, dosage, reminder_active) VALUES
('1001','محمد علي', 'باراسيتامول', '500mg - 3 مرات يومياً', true),
('1004','نورة السعيد', 'أملوديبين', '5mg - مرة يومياً', true),
('1005','خالد الراشد', 'ميتفورمين', '850mg - مرتين يومياً', false);

INSERT INTO public.activity_log (action, description) VALUES
('appointment_booked','تم حجز موعد لـ محمد علي'),
('queue_join','انضمت فاطمة الزهراء إلى قائمة الانتظار'),
('appointment_completed','تم إكمال زيارة محمد علي'),
('reminder_sent','تم إرسال تذكير دواء لـ نورة السعيد'),
('appointment_cancelled','تم إلغاء موعد خالد الراشد');
