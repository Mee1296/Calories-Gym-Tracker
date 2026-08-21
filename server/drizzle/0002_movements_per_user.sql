-- Movements become per-user.
--
-- v2 kept one shared library (user_id IS NULL) that nobody could edit. Every
-- movement now belongs to a user, so the seeded ones can be renamed, retuned
-- and deleted like any other. Shared rows are copied to each user and every
-- reference is repointed at that user's own copy before the column is made
-- NOT NULL. `plane` goes away in the same pass — nothing read it.

-- Copy each shared row to every user lacking a same-named movement.
-- origin_id remembers where a copy came from so references can follow it.
CREATE TEMP TABLE movement_copies AS
SELECT
  lib.id            AS origin_id,
  u.id              AS user_id,
  gen_random_uuid() AS new_id,
  lib.name,
  lib.muscle_group,
  lib.default_weight,
  lib.default_reps
FROM movements lib
CROSS JOIN users u
WHERE lib.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM movements own
    WHERE own.user_id = u.id AND lower(own.name) = lower(lib.name)
  );--> statement-breakpoint

INSERT INTO movements (id, name, muscle_group, default_weight, default_reps, user_id)
SELECT new_id, name, muscle_group, default_weight, default_reps, user_id
FROM movement_copies;--> statement-breakpoint

-- A user who already owned a same-named movement keeps it, so map onto that row.
CREATE TEMP TABLE movement_remap AS
SELECT origin_id, user_id, new_id AS target_id FROM movement_copies
UNION ALL
SELECT lib.id, own.user_id, own.id
FROM movements lib
JOIN movements own ON lower(own.name) = lower(lib.name) AND own.user_id IS NOT NULL
WHERE lib.user_id IS NULL;--> statement-breakpoint

-- Repoint routines; the owner is known through the parent routine.
UPDATE routine_exercises re
SET movement_id = m.target_id
FROM routines r, movement_remap m
WHERE re.routine_id = r.id
  AND m.origin_id = re.movement_id
  AND m.user_id = r.user_id;--> statement-breakpoint

-- Repoint logged history; the owner is known through the parent workout.
UPDATE workout_exercises we
SET movement_id = m.target_id
FROM workouts w, movement_remap m
WHERE we.workout_id = w.id
  AND m.origin_id = we.movement_id
  AND m.user_id = w.user_id;--> statement-breakpoint

-- Fail rather than orphan anything: nothing may still point at a shared row.
DO $$
DECLARE stragglers int;
BEGIN
  SELECT count(*) INTO stragglers
  FROM routine_exercises re JOIN movements m ON m.id = re.movement_id
  WHERE m.user_id IS NULL;
  IF stragglers > 0 THEN
    RAISE EXCEPTION 'routine_exercises still reference % shared movement(s)', stragglers;
  END IF;

  SELECT count(*) INTO stragglers
  FROM workout_exercises we JOIN movements m ON m.id = we.movement_id
  WHERE m.user_id IS NULL;
  IF stragglers > 0 THEN
    RAISE EXCEPTION 'workout_exercises still reference % shared movement(s)', stragglers;
  END IF;
END $$;--> statement-breakpoint

DELETE FROM movements WHERE user_id IS NULL;--> statement-breakpoint

ALTER TABLE "movements" DROP CONSTRAINT "movements_plane_check";--> statement-breakpoint
DROP INDEX "movements_library_name_key";--> statement-breakpoint
DROP INDEX "movements_user_name_key";--> statement-breakpoint
ALTER TABLE "movements" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "movements_user_idx" ON "movements" USING btree ("user_id","muscle_group");--> statement-breakpoint
CREATE UNIQUE INDEX "movements_user_name_key" ON "movements" USING btree ("user_id",lower("name"));--> statement-breakpoint
ALTER TABLE "movements" DROP COLUMN "plane";
