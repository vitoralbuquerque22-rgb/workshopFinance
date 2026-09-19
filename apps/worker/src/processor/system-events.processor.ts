import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@erp/database';

@Processor('system-events')
export class SystemEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemEventsProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const { outboxId, tenantId, payload } = job.data;
    
    // Idempotency check via PostgreSQL
    const idempotencyKey = `${job.name}:${outboxId}`;

    try {
      // Create idempotency record. If it exists, it will throw Unique Constraint violation or we can use upsert
      const record = await prisma.$transaction(async (tx) => {
        const existing = await tx.idempotencyRecord.findUnique({
          where: { idempotencyKey }
        });

        if (existing) {
           return existing;
        }

        return await tx.idempotencyRecord.create({
          data: {
            idempotencyKey,
            tenantId,
            operation: job.name,
            status: 'PROCESSING'
          }
        });
      });

      // If it was already completed, skip processing
      if (record.status === 'COMPLETED') {
        this.logger.warn(`Job ${idempotencyKey} was already processed. Skipping.`);
        return;
      }

      // If PROCESSING, it could be a crash recovery, we will assume it failed and process again.
      // In a real app we might check created_at to see if it's a zombie process lock.
      this.logger.log(`Processing job ${idempotencyKey}...`);
      
      // Simulate external effect (e.g. sending email)
      this.logger.log(`[EXTERNAL EFFECT SIMULATION] Processing payload: ${JSON.stringify(payload)}`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mark as completed
      await prisma.idempotencyRecord.update({
        where: { idempotencyKey },
        data: { status: 'COMPLETED' }
      });

      this.logger.log(`Job ${idempotencyKey} completed successfully.`);

    } catch (error) {
      this.logger.error(`Failed to process job ${idempotencyKey}`, error);
      
      // Mark as failed so it can be retried properly by BullMQ
      await prisma.idempotencyRecord.update({
        where: { idempotencyKey },
        data: { status: 'FAILED' }
      }).catch(e => this.logger.error('Failed to update idempotency to FAILED', e));

      throw error;
    }
  }
}
