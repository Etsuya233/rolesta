import { HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from './api-exception.filter.js';
import { ApiFailure } from './api-failure.js';

describe('ApiExceptionFilter', () => {
  it('logs the internal context of an expected API failure', () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = {
      method: 'PUT',
      originalUrl: '/characters/character/avatar',
      id: 'request-1',
    };
    const cause = new Error('crop precision');
    const failure = new ApiFailure({
      status: HttpStatus.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_FAILED,
      reason: 'invalid-avatar',
      params: { field: 'crop' },
      cause,
    });

    new ApiExceptionFilter(logger as unknown as PinoLogger).catch(
      failure,
      argumentsHost(request, response),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      {
        code: ERROR_CODES.VALIDATION_FAILED,
        statusCode: HttpStatus.BAD_REQUEST,
        method: 'PUT',
        path: '/characters/character/avatar',
        requestId: 'request-1',
        reason: 'invalid-avatar',
        params: { field: 'crop' },
        err: cause,
      },
      'API failure',
    );
  });
});

function argumentsHost(request: Partial<Request>, response: Partial<Response>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
  } as ArgumentsHost;
}
