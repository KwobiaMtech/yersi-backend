import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppRequestContext } from '../context/app-request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const ctx = AppRequestContext.context;
        const requestId = ctx?.requestId || 'unknown';
        const userId = ctx?.userId || 'anonymous';
        
        this.logger.log(
          `[${requestId}] ${method} ${url} - User: ${userId} - ${duration}ms`
        );
      })
    );
  }
}
