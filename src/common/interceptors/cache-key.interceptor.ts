import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CacheKeyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, user } = request;
    
    // Create unique cache key including user ID for personalized data
    const cacheKey = `${method}:${url}:${JSON.stringify(query)}:${user?.id || 'anonymous'}`;
    request.cacheKey = cacheKey;
    
    return next.handle();
  }
}
