import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@erp/database';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(@InjectQueue('system-events') private readonly queue: Queue) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async relayEvents() {
    try {
      // 1. Transaction to fetch and lock events
      const events = await prisma.$transaction(async (tx) => {
        // Fetch up to 100 pending events with FOR UPDATE SKIP LOCKED
        const pendingEvents: any[] = await tx.$queryRaw`
          SELECT id, event_type, payload, tenant_id 
          FROM event_outbox 
          WHERE status = 'PENDING' 
          ORDER BY created_at ASC 
          LIMIT 100 
          FOR UPDATE SKIP LOCKED;
        `;

        if (pendingEvents.length === 0) return [];

        const ids = pendingEvents.map(e => e.id);

        // Mark as PROCESSING to avoid race conditions if transaction takes long
        await tx.$executeRaw`
          UPDATE event_outbox 
          SET status = 'PROCESSING', updated_at = NOW() 
          WHERE id = ANY(ARRAY[${ids}]::uuid[])
        `;

        return pendingEvents;
      });

      // 2. Push to BullMQ and mark as PROCESSED outside the heavy lock
      for (const event of events) {
        await this.queue.add(event.event_type, {
          outboxId: event.id,
          tenantId: event.tenant_id,
          payload: event.payload
        }, {
          jobId: event.id, // BullMQ natively helps with deduplication for a short window
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        });

        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: { status: 'PROCESSED' }
        });
      }

      if (events.length > 0) {
        this.logger.log(`Relayed ${events.length} events to BullMQ.`);
      }
    } catch (error) {
      this.logger.error('Failed to relay outbox events', error);
    }
  }
}
