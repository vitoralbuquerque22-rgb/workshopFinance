import { Controller, Get } from '@nestjs/common';
import { prisma } from '@erp/database';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    let dbStatus = 'down';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      }
    };
  }
}
