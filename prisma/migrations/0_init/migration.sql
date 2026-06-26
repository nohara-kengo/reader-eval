-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "result" TEXT NOT NULL,
    "request_id" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "public"."audit_logs"("actor_id" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_idx" ON "public"."audit_logs"("occurred_at" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "public"."audit_logs"("target_type" ASC, "target_id" ASC);

