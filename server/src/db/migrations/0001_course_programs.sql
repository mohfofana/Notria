-- Course Programs (personalized 4-week learning programs based on assessment)
CREATE TABLE IF NOT EXISTS "course_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL REFERENCES "students"("id"),
	"assessment_id" integer REFERENCES "level_assessments"("id"),
	"title" varchar(255) NOT NULL,
	"total_weeks" integer DEFAULT 4 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"weekly_session_count" integer NOT NULL,
	"session_duration_minutes" integer NOT NULL,
	"overall_level" varchar(50) NOT NULL,
	"weaknesses" jsonb NOT NULL,
	"strengths" jsonb NOT NULL,
	"recommendations" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Course Program Weeks (4 weeks per program)
CREATE TABLE IF NOT EXISTS "course_program_weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL REFERENCES "course_programs"("id"),
	"week_number" integer NOT NULL,
	"theme" varchar(255) NOT NULL,
	"objectives" jsonb NOT NULL,
	"focus_topics" jsonb NOT NULL,
	"status" varchar DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Course Program Sessions (individual daily learning sessions)
CREATE TABLE IF NOT EXISTS "course_program_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_id" integer NOT NULL REFERENCES "course_program_weeks"("id"),
	"day_number" integer NOT NULL,
	"session_order" integer DEFAULT 1 NOT NULL,
	"topic" varchar(255) NOT NULL,
	"type" varchar NOT NULL,
	"engagement_mode" varchar DEFAULT 'discovery' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"difficulty" varchar NOT NULL,
	"content" jsonb,
	"objectives" jsonb,
	"status" varchar DEFAULT 'upcoming' NOT NULL,
	"completed_at" timestamp,
	"score_at_completion" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_program_sessions"
ADD COLUMN IF NOT EXISTS "engagement_mode" varchar DEFAULT 'discovery' NOT NULL;
