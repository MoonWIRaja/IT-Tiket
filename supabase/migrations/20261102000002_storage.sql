-- IT-Tiket storage: private bucket for ticket attachments + RLS policies.
alter table storage.objects enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('ticket-attachments', 'ticket-attachments', false, 20971520) -- 20 MiB
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Read: anyone who may view the ticket (path = <ticket_uuid>/<filename>).
drop policy if exists ticket_attachments_read on storage.objects;
create policy ticket_attachments_read on storage.objects for select to authenticated
  using ( bucket_id = 'ticket-attachments' and public.can_view_ticket_path(name) );

-- Upload: participant or staff, first folder must be the ticket uuid.
drop policy if exists ticket_attachments_upload on storage.objects;
create policy ticket_attachments_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ticket-attachments'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_view_ticket_path(name)
  );

-- Update / delete: staff or the uploader (own files).
drop policy if exists ticket_attachments_update on storage.objects;
create policy ticket_attachments_update on storage.objects for update to authenticated
  using ( bucket_id = 'ticket-attachments' and (public.is_staff() or owner_id = auth.uid()) )
  with check ( bucket_id = 'ticket-attachments' and (public.is_staff() or owner_id = auth.uid()) );

drop policy if exists ticket_attachments_delete on storage.objects;
create policy ticket_attachments_delete on storage.objects for delete to authenticated
  using ( bucket_id = 'ticket-attachments' and (public.is_staff() or owner_id = auth.uid()) );
