import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthApplicationError } from '../application/auth-application-error.js';
import { AuthenticateTokenUseCase } from '../application/authenticate-token.use-case.js';
import { toApiFailure } from './auth-application-error.mapper.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { readBearerToken } from './bearer-token.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthenticateTokenUseCase)
    private readonly authenticateTokenUseCase: AuthenticateTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readBearerToken(request);

    if (!token) {
      throw toApiFailure(new AuthApplicationError('unauthenticated'));
    }

    const user = await this.authenticateTokenUseCase.execute(token);

    if (!user) {
      throw toApiFailure(new AuthApplicationError('unauthenticated'));
    }

    (request as AuthenticatedRequest).authUser = user;
    return true;
  }
}
