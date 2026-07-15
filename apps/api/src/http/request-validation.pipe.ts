import {
  HttpStatus,
  ValidationPipe,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { ERROR_CODES, validationIssuesFromZodError } from '@rolesta/shared';
import { isZodDto } from 'nestjs-zod/dto';
import { ZodError } from 'zod';
import { ApiFailure } from './api-failure.js';

export class RequestValidationPipe implements PipeTransform {
  private readonly legacy = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: () => validationFailure(),
  });

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (!isZodDto(metadata.metatype)) {
      return this.legacy.transform(value, metadata);
    }

    try {
      return metadata.metatype.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw validationFailure(validationIssuesFromZodError(error));
      }
      throw error;
    }
  }
}

function validationFailure(issues?: ReturnType<typeof validationIssuesFromZodError>): ApiFailure {
  return new ApiFailure({
    status: HttpStatus.BAD_REQUEST,
    code: ERROR_CODES.VALIDATION_FAILED,
    params: issues === undefined ? {} : { issues },
  });
}
