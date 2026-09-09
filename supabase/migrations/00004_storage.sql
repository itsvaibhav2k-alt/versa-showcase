-- ============================================================
-- Storage Buckets and Policies
-- ============================================================

-- Call recordings bucket (private, 50MB, audio only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac']
);

-- Avatars bucket (public, 2MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- ============================================================
-- Call Recordings RLS Policies (org-scoped)
-- ============================================================

-- Org members can read their org's recordings
-- Path convention: {organization_id}/{call_log_id}/{filename}
CREATE POLICY "Org members can read recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings'
    AND (storage.foldername(name))[1]::UUID = public.get_user_org_id()
  );

-- Org members can upload recordings to their org folder
CREATE POLICY "Org members can upload recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'call-recordings'
    AND (storage.foldername(name))[1]::UUID = public.get_user_org_id()
  );

-- Org members can delete their org's recordings
CREATE POLICY "Org members can delete recordings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'call-recordings'
    AND (storage.foldername(name))[1]::UUID = public.get_user_org_id()
  );

-- ============================================================
-- Avatars RLS Policies (user-scoped CRUD, public read)
-- ============================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatar read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
-- Path convention: {user_id}/{filename}
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1]::UUID = auth.uid()
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1]::UUID = auth.uid()
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1]::UUID = auth.uid()
  );
