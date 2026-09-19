-- CreateTable
CREATE TABLE "empresa" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "documento" VARCHAR(14) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_outbox" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "correlation_id" UUID,
    "causation_id" UUID,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_record" (
    "idempotency_key" VARCHAR(255) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "response_body" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "idempotency_record_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresa_documento_key" ON "empresa"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_empresa_id_idx" ON "user"("empresa_id");

-- CreateIndex
CREATE INDEX "event_outbox_status_created_at_idx" ON "event_outbox"("status", "created_at");

-- CreateIndex
CREATE INDEX "event_outbox_tenant_id_idx" ON "event_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "idempotency_record_tenant_id_idx" ON "idempotency_record"("tenant_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_outbox" ADD CONSTRAINT "event_outbox_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_record" ADD CONSTRAINT "idempotency_record_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
