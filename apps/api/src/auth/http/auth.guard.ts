import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticateTokenUseCase } from '../application/authenticate-token.use-case.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { readBearerToken } from './bearer-token.js';
import { AuthApplicationError } from '../application/auth-application-error.js';
import { toApiFailure } from './auth-application-error.mapper.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authenticateTokenUseCase: AuthenticateTokenUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readBearerToken(request);

    if (!token) {
      throw toApiFailure(
        new AuthApplicationError({
          reason: 'unauthenticated',
          params: { source: 'bearer-token' },
        }),
      );
    }

    const user = await this.authenticateTokenUseCase.execute(token);

    if (!user) {
      throw toApiFailure(
        new AuthApplicationError({
          reason: 'unauthenticated',
          params: { source: 'bearer-token' },
        }),
      );
    }

    (request as AuthenticatedRequest).authUser = user;
    return true;
  }
}
