import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { RequestContextMiddleware } from './common/context/request-context.middleware.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
