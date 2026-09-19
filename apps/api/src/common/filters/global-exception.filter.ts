import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContext } from '../context/request-context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const reqCtx = RequestContext.getStore();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal Server Error';
    
    // Log exception safely without leaking stack trace to user
    this.logger.error(`[${reqCtx?.requestId || 'NO-REQ-ID'}] ${request.method} ${request.url} - ${message}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR',
        message: status === 500 ? 'An unexpected error occurred.' : message,
        requestId: reqCtx?.requestId,
      },
    });
  }
}
