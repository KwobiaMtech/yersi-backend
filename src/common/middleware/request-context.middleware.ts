import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppRequestContext } from '../context/app-request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const user = req.user as any;

    AppRequestContext.setContext({
      requestId,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      timestamp: new Date(),
    });

    res.setHeader('X-Request-ID', requestId);
    next();
  }
}
