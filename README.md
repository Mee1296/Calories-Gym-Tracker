# Stride

A gym and nutrition tracker: log meals and macros, run workouts set by set, and watch
body weight and lifts trend over time.

- `client/` — Next.js (pages router), no UI framework, design tokens in `src/theme`
- `server/` — Express + Drizzle on Postgres, layered as routes → controllers → services → db

## Running it

```bash
cp server/.env.example server/.env    # set JWT_SECRET at minimum
docker compose up --build
```

Web on <http://localhost:3000>, API on <http://localhost:5000>, Postgres on `:5432`.

### Docker layout

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | The stack: Postgres, API and web as production images |
| `docker-compose.dev.yml` | Overlay that swaps in hot-reloading dev servers |
| `*/Dockerfile` | Multi-stage production build, runs as the unprivileged `node` user |
| `*/Dockerfile.dev` | Single stage with dev dependencies, source bind-mounted |

Hot reload while developing:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Source is bind-mounted and `node_modules` lives in an anonymous volume, so the container's
install is never shadowed by the host's.

One-shot tasks run against the same Postgres:

```bash
docker compose run --rm seed       # refresh the movement library
docker compose run --rm migrate    # upgrade a v1 database (see below)
```

**`NEXT_PUBLIC_API_URL` is baked in at build time.** Next inlines `NEXT_PUBLIC_*` into the
browser bundle, so setting it only at runtime has no effect on the production image. It is
the URL the *browser* calls, not an internal service name — `http://localhost:5000/api` by
default. To point elsewhere, rebuild:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api docker compose build client
```

The dev overlay reads it at runtime instead, so no rebuild is needed there.

### Without Docker

```bash
cd server && npm install && npm run dev   # :5000
cd client && npm install && npm run dev   # :3000
```

The shared movement library seeds itself the first time the API starts against an empty
database. `npm run seed` in `server/` re-runs it to pick up library changes.

### Database

Postgres, accessed through Drizzle. The schema lives in `server/src/db/schema.js`; SQL
migrations are generated into `server/drizzle/` and applied automatically on boot, so a
blank database becomes a working one with no manual step.

```bash
cd server
npm run db:generate   # after editing schema.js — writes a new SQL migration
npm run db:studio     # browse the data
```

**Pointing at Supabase**: Project Settings → Database → Connection string → *Session
pooler*, and put it in `DATABASE_URL`. Use the session pooler on `:5432` for a
long-running server; the transaction pooler on `:6543` works too, since the driver already
disables prepared statements.

### Row level security

Supabase publishes every `public` table through PostgREST, reachable with the project's
anon key. This app never uses that path — the Express server owns all access — so
migration `0001_rls_lockdown` enables RLS on all ten tables with **no policies** and
revokes the `anon`/`authenticated` grants. PostgREST is then closed entirely.

The API is unaffected: it connects as `postgres`, which owns the tables, and table owners
bypass RLS unless `FORCE ROW LEVEL SECURITY` is set. The full test suite passes with RLS
on, which is the check that matters.

Any table added later must be locked down in the same way. The migration ends with a
guard that raises an exception if a `public` table is left without RLS, so a forgotten one
fails the migration rather than silently going public.

If the app ever queries Supabase directly from the browser, these tables need real
policies instead, e.g. `USING (user_id = auth.uid())`.

### Migrating from the MongoDB version

The importer reads either Mongo shape — the original Gym Tracker schema or the later
Stride/Mongo one — so there is no intermediate step.

Point `MONGO_URI` in `server/.env` at the old database — an Atlas cluster, a local
`mongod`, anywhere reachable — then:

```bash
docker compose run --rm migrate --dry   # report, writes nothing
docker compose run --rm migrate         # copy
```

Or without Docker, from `server/`: `npm run migrate -- --dry`, then `npm run migrate`.

The whole copy runs in one transaction: if anything fails, Postgres is left untouched. It
refuses to run against a non-empty Postgres unless you pass `--force`, since a second run
would duplicate everything. Along the way it maps `targetCalories` → `goal_*`, the old
`category` values (`arm`→`arms`, `delts`→`shoulders`, `abs`→`core`), the `saggital` typo,
`weight`→`kg` and `startTime`→`started_at`; collapses duplicate weigh-in days and
case-variant dishes; and drops exercises whose movement no longer exists, since a foreign
key would otherwise reject them.

Once you have migrated, delete the `migrate` service from `docker-compose.yml` and drop
the `mongodb` dependency — nothing else in the app uses it.

## How it fits together

The client never calls axios directly. Screens use hooks (`src/hooks`), hooks call
`src/lib/endpoints.js`, and that module is the only place that knows the API's shape.
A single axios instance attaches the JWT and, on a 401, clears the session and returns
the user to the sign-in screen.

On the server, controllers only unpack the request and shape the response; all rules live
in `src/services`. Errors are thrown as `ApiError` and rendered by one middleware, so every
failure reaches the client as `{ error: { message } }`.

### Data model

| Table | Notes |
| --- | --- |
| `users` | Credentials, daily goal columns, optional body-metric profile |
| `movements` | Per-user library, seeded at signup; `archived_at` retires one without losing history |
| `routines` + `routine_exercises` | New accounts get Push/Pull/Legs; `position` preserves order |
| `workouts` + `workout_exercises` + `workout_sets` | Sets are their own rows because PR detection scans them |
| `weights` | `UNIQUE (user_id, date)` — one weigh-in per day, enforced by the database |
| `meals` | Macros scoped to a calendar `date`; the ingredient breakdown is JSONB |
| `dishes` | Food library, upserted per meal log; `UNIQUE (user_id, slug)` merges case variants |

Ordering that Mongo got free from arrays is an explicit `position` column. JSONB is used
only where a value is written and read whole and never queried into.

Every movement belongs to a user — new accounts are seeded with the starter library —
so any of them can be renamed, retuned or deleted. Deleting one drops it from any
routine that used it; if logged sessions reference it, it is archived instead so the
history keeps its rows. `UNIQUE (user_id, lower(name))` is partial (`WHERE archived_at
IS NULL`) so an archived name can be used again.

### API

All routes are under `/api`. Everything except `/health` and `/auth/*` needs
`Authorization: Bearer <token>` and is scoped to the calling user.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login` | Returns `{ token, user }` |
| `GET` | `/auth/me` | Current user |
| `GET` `POST` | `/movements` | Library; POST adds one |
| `PATCH` `DELETE` | `/movements/:id` | Edit / delete (deletes cascade out of routines) |
| `GET` | `/movements/:id/usage` | Routines and logged sessions a delete would touch |
| `GET` `POST` | `/routines` | List / create |
| `PATCH` `DELETE` | `/routines/:id` | Update / delete |
| `GET` `POST` | `/workouts` | History / finish a session (returns `{ workout, prs }`) |
| `POST` | `/workouts/last` | Last sets for many movements at once |
| `GET` `POST` | `/weights` | History / log (upserts by day) |
| `GET` `POST` | `/meals` | A day's meals, totals and goals / log a meal |
| `DELETE` | `/meals/:id` | Remove a meal |
| `GET` | `/meals/dishes` | The user's food library |
| `GET` `PUT` | `/goals` | Read / update daily targets |
| `GET` | `/nutrition/status` | Whether AI estimates are configured |
| `POST` | `/nutrition/estimate` | Estimate a meal's macros (does not log it) |
| `POST` | `/nutrition/suggest-goals` | Suggest targets from body metrics |
| `GET` | `/stats/overview` | Everything the Progress screen shows |

### Personal records

A set's strength is compared with the Epley estimated 1RM (`weight × (1 + reps/30)`), so a
heavier triple can beat a lighter set of eight. Finishing a workout compares each movement
against every prior session — one `GROUP BY` over `workout_sets` — and returns the records
that were actually broken.

### AI estimates

`GEMINI_API_KEY` is optional. Without it the AI endpoints return 503 and the client hides
those tabs, so meal logging and goal setting still work entirely by hand. Requests use
Gemini's structured-output mode against a fixed JSON schema.
