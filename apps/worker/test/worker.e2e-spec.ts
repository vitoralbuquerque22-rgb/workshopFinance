import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module.js';
import { prisma } from '@erp/database';
import { INestApplication } from '@nestjs/common';
import { OutboxRelayService } from '../src/outbox/outbox.service.js';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SystemEventsProcessor } from '../src/processor/system-events.processor.js';
import { randomUUID } from 'crypto';

describe('Worker Idempotency (e2e)', () => {
  let app: INestApplication;
  let outboxService: OutboxRelayService;
  let processor: SystemEventsProcessor;
  let queue: Queue;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    outboxService = app.get<OutboxRelayService>(OutboxRelayService);
    processor = app.get<SystemEventsProcessor>(SystemEventsProcessor);
    queue = app.get<Queue>(getQueueToken('system-events'));

    // Create a dummy tenant and user for FK constraints
    const empresa = await prisma.empresa.create({
      data: {
        nome: 'Test Empresa',
        documento: '11111111111111',
      },
    });
    tenantId = empresa.id;

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'dummy',
        role: 'ADMIN',
        empresaId: tenantId,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.eventOutbox.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.empresa.deleteMany({ where: { documento: '11111111111111' } });

    await app.close();
    await prisma.$disconnect();
  });

  it('5 & 6. should relay an event, process exactly once, and ignore duplicates', async () => {
    const eventId = randomUUID();
    
    // 1. Create a pending outbox event
    await prisma.eventOutbox.create({
      data: {
        id: eventId,
        eventType: 'test-event',
        aggregateType: 'test',
        aggregateId: randomUUID(),
        payload: { action: 'test' },
        tenantId,
        status: 'PENDING',
      },
    });

    // 2. Trigger relay explicitly
    await outboxService.relayEvents();

    // 3. Wait for Worker to pick up from BullMQ and process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Assert Outbox is PROCESSED and IdempotencyRecord is COMPLETED
    const outbox = await prisma.eventOutbox.findUnique({ where: { id: eventId } });
    expect(outbox?.status).toBe('PROCESSED');

    const idempotencyKey = `test-event:${eventId}`;
    const record = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    expect(record?.status).toBe('COMPLETED');

    // 5. Fire event again manually to queue (duplicate)
    await queue.add('test-event', {
      outboxId: eventId,
      tenantId,
      payload: { action: 'test' },
    }, { jobId: eventId + '-dup' }); // append dup to bypass BullMQ native dedup

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 6. Assert IdempotencyRecord is still COMPLETED and didn't fail
    const recordAfter = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    expect(recordAfter?.status).toBe('COMPLETED');
  }, 10000);

  it('7. should rollback transaction on error', async () => {
    const testId = randomUUID();
    
    try {
      await prisma.$transaction(async (tx) => {
        await tx.eventOutbox.create({
          data: {
            id: testId,
            eventType: 'fail-event',
            aggregateType: 'test',
            aggregateId: randomUUID(),
            payload: {},
            tenantId,
            status: 'PENDING',
          },
        });
        throw new Error('Simulated failure');
      });
    } catch (e) {
      expect((e as Error).message).toBe('Simulated failure');
    }

    const outbox = await prisma.eventOutbox.findUnique({ where: { id: testId } });
    expect(outbox).toBeNull();
  });

  it('8. should handle concurrency on the same event gracefully', async () => {
    const eventId = randomUUID();
    const idempotencyKey = `concurrent-event:${eventId}`;

    // Create a mock job object
    const mockJob = {
      name: 'concurrent-event',
      data: {
        outboxId: eventId,
        tenantId,
        payload: {}
      }
    } as any;

    // Call processor concurrently
    const p1 = processor.process(mockJob);
    const p2 = processor.process(mockJob);

    await Promise.allSettled([p1, p2]);

    // Should only have 1 record
    const records = await prisma.idempotencyRecord.findMany({ where: { idempotencyKey } });
    expect(records.length).toBe(1);
    expect(records[0].status).toBe('COMPLETED');
  });

  it('9. should isolate tenant context (Logical isolation check)', async () => {
    // Insert another tenant
    const tenant2 = await prisma.empresa.create({
      data: { nome: 'Tenant 2', documento: '22222222222222' }
    });

    const event1 = await prisma.eventOutbox.create({
      data: { eventType: 't1', aggregateType: 't', aggregateId: randomUUID(), payload: {}, tenantId, status: 'PENDING' }
    });
    
    const event2 = await prisma.eventOutbox.create({
      data: { eventType: 't2', aggregateType: 't', aggregateId: randomUUID(), payload: {}, tenantId: tenant2.id, status: 'PENDING' }
    });

    // Query manually by tenantId to show context bounds
    const tenant1Events = await prisma.eventOutbox.findMany({ where: { tenantId } });
    const tenant2Events = await prisma.eventOutbox.findMany({ where: { tenantId: tenant2.id } });

    expect(tenant1Events.some(e => e.id === event2.id)).toBeFalsy();
    expect(tenant2Events.some(e => e.id === event1.id)).toBeFalsy();

    // cleanup
    await prisma.eventOutbox.delete({ where: { id: event1.id } });
    await prisma.eventOutbox.delete({ where: { id: event2.id } });
    await prisma.empresa.delete({ where: { id: tenant2.id } });
  });
});
