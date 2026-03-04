# Database Workflow

This project now keeps SQL in ordered folders:

- `migrations/`: schema and policy changes (run in filename order)
- `seeds/`: optional mock/sample data
- `host_roma_link_my_user.sql`: local/dev utility to bind a real auth user to Host Roma

## 1) Existing database (already running)

Do **not** rerun everything. Run only migrations that are new for your DB state.

For your current state, the important one to run now is:

- `migrations/20260304200500_profiles_update_policy.sql`
- `migrations/20260304200600_profiles_phone_columns.sql`
- `migrations/20260304200700_hosts_phone_columns.sql`
- `migrations/20260304200800_services_price_decimal.sql`

If storage upload/policies are not yet applied in your project, also run:

- `migrations/20260304200400_storage_avatars_policies.sql`

If host slot RLS is not yet applied, also run:

- `migrations/20260304200300_service_slots_host_policies.sql`

## 2) Fresh database from zero (clean rebuild)

Run, in order:

1. `migrations/20260304200100_schema_base.sql`
2. `migrations/20260304200200_schema_v2.sql`
3. `migrations/20260304200300_service_slots_host_policies.sql`
4. `migrations/20260304200400_storage_avatars_policies.sql`
5. `migrations/20260304200500_profiles_update_policy.sql`

Optional mock data:

1. `seeds/mock_core.sql`
2. `seeds/mock_hosts_and_slots.sql`
3. `seeds/mock_hosts_phone.sql`

Optional host-user link for local testing:

- `host_roma_link_my_user.sql` (edit UUID first)

## 3) Rule for future changes

When you change DB schema/policies:

1. Add a **new** file in `migrations/` with a higher timestamp.
2. Keep it idempotent when possible (`if not exists`, `add column if not exists`, etc.).
3. Never edit old migrations after they are shared/applied.

## 4) Portability outside Supabase

Not all SQL is portable:

- Supabase-specific: `auth.uid()`, `auth.users`, `storage.*` policies.
- Mostly portable PostgreSQL domain schema: core table design and constraints.

If you want easy migration to a non-Supabase stack later:

1. Keep business tables in portable SQL files.
2. Keep auth/storage policies in provider-specific migration files.
3. Treat provider-specific files as adapters.
