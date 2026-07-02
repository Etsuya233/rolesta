import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

type ResponseEnvelope<TData> = {
  code: number;
  msg: string;
  data: TData;
};

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<unknown>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        code: 0,
        msg: 'ok',
        data,
      })),
    );
  }
}
