-- Enum for document type and status
DO $$ BEGIN
  CREATE TYPE public.driver_document_type AS ENUM (
    'cnh_front','cnh_back','crlv','selfie_with_doc','moto_front','moto_plate'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.driver_document_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.driver_onboarding_status AS ENUM ('pending_documents','in_review','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Driver documents table
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  type public.driver_document_type NOT NULL,
  file_path TEXT NOT NULL,
  status public.driver_document_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (driver_id, type)
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON public.driver_documents(status);

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage own documents"
  ON public.driver_documents FOR ALL
  TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all documents"
  ON public.driver_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_driver_documents_updated
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add onboarding columns to drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS onboarding_status public.driver_onboarding_status NOT NULL DEFAULT 'pending_documents',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('driver-documents','driver-documents', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: file path layout = {driver_user_id}/{type}-{timestamp}.{ext}
CREATE POLICY "Drivers upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Drivers update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );