import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { OutboxRelayService } from './outbox/outbox.service';
import { SystemEventsProcessor } from './processor/system-events.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'system-events',
    }),
  ],
  providers: [OutboxRelayService, SystemEventsProcessor],
})
export class AppModule {}
