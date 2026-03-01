CREATE TABLE IF NOT EXISTS "parent_notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer NOT NULL,
  "student_id" integer NOT NULL,
  "notification_id" varchar(120) NOT NULL,
  "type" varchar(50) NOT NULL,
  "message" text NOT NULL,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "parent_notifications"
  ADD CONSTRAINT "parent_notifications_parent_id_parents_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id")
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "parent_notifications"
  ADD CONSTRAINT "parent_notifications_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id")
  ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "parent_notifications_parent_student_idx"
  ON "parent_notifications" ("parent_id", "student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "parent_notifications_unique"
  ON "parent_notifications" ("parent_id", "student_id", "notification_id");
