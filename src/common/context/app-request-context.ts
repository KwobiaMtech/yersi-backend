export interface IAppRequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export class AppRequestContext {
  private static _context: IAppRequestContext;

  static get context(): IAppRequestContext {
    return this._context;
  }

  static setContext(context: IAppRequestContext): void {
    this._context = context;
  }
}
