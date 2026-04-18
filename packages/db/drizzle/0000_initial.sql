CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE "task_status" AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assignees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "tg_username" text,
  "color" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "color" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "task_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "assignee_id" uuid REFERENCES "assignees"("id"),
  "tag_id" uuid REFERENCES "tags"("id"),
  "recurrence_rule" text,
  "active_window_days" integer NOT NULL DEFAULT 3,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "protocols" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "filename" text NOT NULL,
  "original_text" text NOT NULL,
  "uploaded_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid REFERENCES "task_templates"("id"),
  "title" text NOT NULL,
  "description" text,
  "assignee_id" uuid REFERENCES "assignees"("id"),
  "tag_id" uuid REFERENCES "tags"("id"),
  "due_at" timestamptz NOT NULL,
  "status" "task_status" NOT NULL DEFAULT 'todo',
  "source" text NOT NULL,
  "source_protocol_id" uuid REFERENCES "protocols"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "tasks_due_at_idx" ON "tasks" ("due_at");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks" ("assignee_id");

CREATE TABLE IF NOT EXISTS "protocol_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "protocol_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "chunk_text" text NOT NULL,
  "embedding" vector(1024),
  "chunk_index" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "protocol_chunks_embedding_idx"
  ON "protocol_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS "parse_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "protocol_id" uuid NOT NULL REFERENCES "protocols"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "undone_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "parse_batch_tasks" (
  "batch_id" uuid NOT NULL REFERENCES "parse_batches"("id"),
  "task_id" uuid NOT NULL REFERENCES "tasks"("id"),
  PRIMARY KEY ("batch_id", "task_id")
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_name" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "events_event_name_idx" ON "events" ("event_name");
