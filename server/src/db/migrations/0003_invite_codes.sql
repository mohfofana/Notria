ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "invite_code" varchar(8);
--> statement-breakpoint
ALTER TABLE "parents"
ADD COLUMN IF NOT EXISTS "invite_code" varchar(8);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "students_invite_code_unique"
ON "students" ("invite_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "parents_invite_code_unique"
ON "parents" ("invite_code");
