import { ArgumentsHost, Catch, HttpException, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import { ERROR_CODES, I18N_MESSAGE_PREFIX, type ApiErrorEnvelope } from '@rolesta/shared';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ApiFailure, createInternalApiFailure } from './api-failure.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(ApiExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const rawStatusCode =
      typeof exception === 'object' && exception !== null && 'statusCode' in exception
        ? exception.statusCode
        : undefined;
    const payloadTooLarge = rawStatusCode === HttpStatus.PAYLOAD_TOO_LARGE;
    const apiFailure =
      exception instanceof ApiFailure
        ? exception
        : payloadTooLarge
          ? new ApiFailure({
              status: HttpStatus.PAYLOAD_TOO_LARGE,
              code: ERROR_CODES.VALIDATION_FAILED,
            })
          : createInternalApiFailure();
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : payloadTooLarge
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const request = host.switchToHttp().getRequest<Request>();

    const envelope: ApiErrorEnvelope = {
      code: apiFailure.code,
      msg: `${I18N_MESSAGE_PREFIX}${apiFailure.messageKey}`,
      data: apiFailure.params,
    };

    this.logException(exception, apiFailure, httpStatus, request);

    host.switchToHttp().getResponse<Response>().status(httpStatus).json(envelope);
  }

  private logException(exception: unknown, apiFailure: ApiFailure, httpStatus: number, request: Request): void {
    const fields = {
      code: apiFailure.code,
      statusCode: httpStatus,
      method: request.method,
      path: request.originalUrl,
    };

    if (exception instanceof ApiFailure) {
      this.logger.warn(fields, 'API failure');
      return;
    }

    if (httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR.valueOf()) {
      this.logger.error({ ...fields, err: exception }, 'Unhandled API exception');
      return;
    }

    this.logger.warn({ ...fields, err: exception }, 'HTTP exception');
  }
}
