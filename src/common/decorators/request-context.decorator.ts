import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRequestContext, IAppRequestContext } from '../context/app-request-context';

export const ReqContext = createParamDecorator(
  (data: keyof IAppRequestContext, ctx: ExecutionContext) => {
    const context = AppRequestContext.context;
    return data ? context?.[data] : context;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return AppRequestContext.context?.userId;
  },
);

export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return AppRequestContext.context?.requestId;
  },
);
