import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AppRequestContext } from '../context/app-request-context';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user as any;
    const requestId = uuidv4();

    AppRequestContext.setContext({
      requestId,
      userId: user?.userId || user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ip: request.ip,
      userAgent: request.get('User-Agent') || '',
      timestamp: new Date(),
    });

    response.setHeader('X-Request-ID', requestId);
    return next.handle();
  }
}
