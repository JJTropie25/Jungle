-- Storage policies for listing/profile images in bucket "avatars".
-- Assumes object name format: <user_id>/filename.ext

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_public_read'
  ) then
    create policy avatars_public_read
      on storage.objects
      for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_insert_own_folder'
  ) then
    create policy avatars_insert_own_folder
      on storage.objects
      for insert
      with check (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_update_own_folder'
  ) then
    create policy avatars_update_own_folder
      on storage.objects
      for update
      using (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_delete_own_folder'
  ) then
    create policy avatars_delete_own_folder
      on storage.objects
      for delete
      using (
        bucket_id = 'avatars'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

