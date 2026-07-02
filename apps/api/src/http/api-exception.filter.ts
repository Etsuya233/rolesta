import { ArgumentsHost, Catch, HttpException, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import { ERROR_CODES, type ApiEnvelope } from '@rolesta/shared';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpStatus: HttpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const envelope: ApiEnvelope<null> = {
      code: ERROR_CODES.INTERNAL_ERROR,
      msg: 'failed',
      data: null,
    };

    host.switchToHttp().getResponse<Response>().status(httpStatus).json(envelope);
  }
}
