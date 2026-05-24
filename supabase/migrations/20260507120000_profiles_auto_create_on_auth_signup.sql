create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.triggers
    where trigger_schema = 'auth'
      and event_object_table = 'users'
      and trigger_name = 'on_auth_user_created_profile'
  ) then
    create trigger on_auth_user_created_profile
    after insert on auth.users
    for each row execute function public.handle_new_auth_user_profile();
  end if;
end;
$$;
