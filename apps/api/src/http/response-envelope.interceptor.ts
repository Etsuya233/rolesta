import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { ApiEnvelope } from '@rolesta/shared';
import { map, type Observable } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiEnvelope<unknown>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        code: 0,
        msg: 'ok',
        data,
      })),
    );
  }
}
