import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { AuthModule } from './auth/auth.module';

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
