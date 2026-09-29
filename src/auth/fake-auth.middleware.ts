import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class FakeAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const accountId = req.header('x-account-id');
    if (!accountId) throw new UnauthorizedException();
    Object.assign(req, { user: { accountId } });
    next();
  }
}
