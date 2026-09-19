import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../context/request-context.js';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    // In a real app, tenantId and userId would come from JWT Auth Guard
    const tenantId = (req.headers['x-tenant-id'] as string) || undefined; 

    RequestContext.run({ requestId, tenantId }, () => {
      res.setHeader('x-request-id', requestId);
      next();
    });
  }
}
