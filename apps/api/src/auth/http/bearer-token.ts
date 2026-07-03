import type { Request } from 'express';

export function readBearerToken(request: Request): string | null {
  const authorization = request.header('authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
