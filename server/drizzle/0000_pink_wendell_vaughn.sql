CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"goal_calories" integer DEFAULT 2400 NOT NULL,
	"goal_protein" integer DEFAULT 160 NOT NULL,
	"goal_carbs" integer DEFAULT 250 NOT NULL,
	"goal_fat" integer DEFAULT 75 NOT NULL,
	"profile_height_cm" numeric(5, 1),
	"profile_age" integer,
	"profile_gender" text,
	"profile_body_fat" numeric(4, 1),
	"profile_activity_level" text DEFAULT 'moderately active',
	"profile_goal" text DEFAULT 'maintain',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("users"."role" in ('user','admin')),
	CONSTRAINT "users_goal_calories_check" CHECK ("users"."goal_calories" > 0)
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text NOT NULL,
	"plane" text DEFAULT '-' NOT NULL,
	"default_weight" numeric(6, 1) DEFAULT '0' NOT NULL,
	"default_reps" integer DEFAULT 10 NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movements_group_check" CHECK ("movements"."muscle_group" in ('chest','back','shoulders','arms','legs','core')),
	CONSTRAINT "movements_plane_check" CHECK ("movements"."plane" in ('frontal','sagittal','transverse','-'))
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"weight" numeric(6, 1) DEFAULT '0' NOT NULL,
	"reps" integer DEFAULT 10 NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "routine_exercises_sets_check" CHECK ("routine_exercises"."sets" between 1 and 20)
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'Quick Workout' NOT NULL,
	"routine_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"total_sets" integer DEFAULT 0 NOT NULL,
	"volume" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_exercise_id" uuid NOT NULL,
	"weight" numeric(6, 1) NOT NULL,
	"reps" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "workout_sets_reps_check" CHECK ("workout_sets"."reps" >= 0),
	CONSTRAINT "workout_sets_weight_check" CHECK ("workout_sets"."weight" >= 0)
);
--> statement-breakpoint
CREATE TABLE "weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kg" numeric(5, 2) NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weights_kg_check" CHECK ("weights"."kg" > 0 and "weights"."kg" <= 700)
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer DEFAULT 0 NOT NULL,
	"carbs" integer DEFAULT 0 NOT NULL,
	"fat" integer DEFAULT 0 NOT NULL,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"date" date NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meals_source_check" CHECK ("meals"."source" in ('manual','quick','ai')),
	CONSTRAINT "meals_calories_check" CHECK ("meals"."calories" >= 0)
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer DEFAULT 0 NOT NULL,
	"carbs" integer DEFAULT 0 NOT NULL,
	"fat" integer DEFAULT 0 NOT NULL,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"use_count" integer DEFAULT 1 NOT NULL,
	"last_used" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_movement_id_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_movement_id_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weights" ADD CONSTRAINT "weights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_key" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "movements_library_name_key" ON "movements" USING btree (lower("name")) WHERE "movements"."user_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "movements_user_name_key" ON "movements" USING btree ("user_id",lower("name")) WHERE "movements"."user_id" is not null;--> statement-breakpoint
CREATE INDEX "routines_user_idx" ON "routines" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_exercises_position_key" ON "routine_exercises" USING btree ("routine_id","position");--> statement-breakpoint
CREATE INDEX "workouts_user_started_idx" ON "workouts" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_exercises_position_key" ON "workout_exercises" USING btree ("workout_id","position");--> statement-breakpoint
CREATE INDEX "workout_exercises_movement_idx" ON "workout_exercises" USING btree ("movement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_sets_position_key" ON "workout_sets" USING btree ("workout_exercise_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "weights_user_date_key" ON "weights" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "meals_user_date_idx" ON "meals" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "dishes_user_slug_key" ON "dishes" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "dishes_user_recent_idx" ON "dishes" USING btree ("user_id","last_used");