-- Allow public (anonymous) read of basic clinic config for booking page
CREATE POLICY "clinic_config_public_read" ON public.clinic_config
FOR SELECT TO anon USING (true);