import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Worker is a headless app (no HTTP listener)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {}
  );
  
  await app.listen();
  console.log('Worker is running and listening for jobs...');
}
bootstrap();
