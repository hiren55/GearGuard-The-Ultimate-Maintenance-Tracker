-- Migration: Create Storage Buckets and Policies
-- Description: Configure Supabase Storage for file uploads
-- ============================================================

-- ============================================================
-- CREATE STORAGE BUCKETS
-- ============================================================

-- Equipment images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images',
  'equipment-images',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Documents bucket (manuals, certificates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Request attachments bucket (work photos, receipts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-attachments',
  'request-attachments',
  false,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES: equipment-images
-- ============================================================

-- Authenticated users can view equipment images
CREATE POLICY "Equipment images are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'equipment-images'
  AND auth.role() = 'authenticated'
);

-- Admin and managers can upload equipment images
CREATE POLICY "Admins and managers can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-images'
  AND auth.role() = 'authenticated'
  AND get_my_role() IN ('admin', 'manager')
);

-- Admin and managers can update equipment images
CREATE POLICY "Admins and managers can update equipment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-images'
  AND auth.role() = 'authenticated'
  AND get_my_role() IN ('admin', 'manager')
);

-- Only admins can delete equipment images
CREATE POLICY "Only admins can delete equipment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-images'
  AND auth.role() = 'authenticated'
  AND get_my_role() = 'admin'
);

-- ============================================================
-- STORAGE POLICIES: documents
-- ============================================================

-- Authenticated users can view documents
CREATE POLICY "Documents are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Admin and managers can upload documents
CREATE POLICY "Admins and managers can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND get_my_role() IN ('admin', 'manager')
);

-- Admin and managers can update documents
CREATE POLICY "Admins and managers can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND get_my_role() IN ('admin', 'manager')
);

-- Only admins can delete documents
CREATE POLICY "Only admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND get_my_role() = 'admin'
);

-- ============================================================
-- STORAGE POLICIES: request-attachments
-- ============================================================

-- Authenticated users can view request attachments
CREATE POLICY "Request attachments are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-attachments'
  AND auth.role() = 'authenticated'
);

-- Authenticated users can upload request attachments
CREATE POLICY "Authenticated users can upload request attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-attachments'
  AND auth.role() = 'authenticated'
);

-- Users can update their own uploads
CREATE POLICY "Users can update their own request attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'request-attachments'
  AND auth.role() = 'authenticated'
  AND (owner_id = auth.uid() OR get_my_role() = 'admin')
);

-- Users can delete their own uploads, admins can delete any
CREATE POLICY "Users can delete their own request attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'request-attachments'
  AND auth.role() = 'authenticated'
  AND (owner_id = auth.uid() OR get_my_role() = 'admin')
);

-- ============================================================
-- STORAGE POLICIES: avatars (public bucket)
-- ============================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
