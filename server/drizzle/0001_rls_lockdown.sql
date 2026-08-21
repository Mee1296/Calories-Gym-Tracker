-- Deny-all row level security.
--
-- Supabase publishes every table in the `public` schema through PostgREST at
-- https://<ref>.supabase.co/rest/v1/, reachable with the project's anon key.
-- This app never uses that path: the Express server owns all access and does
-- its own user scoping.
--
-- Enabling RLS with *no policies* closes PostgREST completely — the `anon` and
-- `authenticated` roles it uses match no policy, so every row is filtered out.
-- The API is unaffected: it connects as `postgres`, which owns these tables,
-- and table owners bypass RLS unless FORCE ROW LEVEL SECURITY is set.
--
-- If this app ever moves to querying Supabase directly from the browser, each
-- table needs a real policy such as:
--   CREATE POLICY user_owns_row ON meals FOR ALL USING (user_id = auth.uid());
--
-- Any table added later must be locked down here too; the check at the bottom
-- of this file fails the migration if one is missed.

ALTER TABLE "users"             ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "movements"         ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routines"          ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routine_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workouts"          ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_sets"      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weights"           ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "meals"             ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dishes"            ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Revoke the blanket grants Supabase hands the API roles, so the tables are not
-- merely filtered but unreachable. Harmless on a plain Postgres where these
-- roles do not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
  END IF;
END $$;--> statement-breakpoint

-- Fail loudly if a table in `public` was added without RLS.
DO $$
DECLARE unprotected text;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity
    AND c.relname <> '__drizzle_migrations';

  IF unprotected IS NOT NULL THEN
    RAISE EXCEPTION 'Tables without row level security: %', unprotected;
  END IF;
END $$;
