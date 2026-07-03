import { ArgumentsHost, Catch, HttpException, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import { I18N_MESSAGE_PREFIX, type ApiErrorEnvelope } from '@rolesta/shared';
import type { Response } from 'express';
import { ApiFailure, createInternalApiFailure } from './api-failure.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const apiFailure = exception instanceof ApiFailure ? exception : createInternalApiFailure();
    const httpStatus: HttpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const envelope: ApiErrorEnvelope = {
      code: apiFailure.code,
      msg: `${I18N_MESSAGE_PREFIX}${apiFailure.messageKey}`,
      data: apiFailure.params,
    };

    host.switchToHttp().getResponse<Response>().status(httpStatus).json(envelope);
  }
}
