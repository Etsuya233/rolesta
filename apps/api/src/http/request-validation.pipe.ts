import {
  HttpStatus,
  ValidationPipe,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import {
  ERROR_CODES,
  VALIDATION_RULES,
  validationIssuesFromZodError,
  type ValidationIssue,
} from '@rolesta/shared';
import type { ValidationError } from 'class-validator';
import { isZodDto } from 'nestjs-zod/dto';
import { ZodError } from 'zod';
import { ApiFailure } from './api-failure.js';

export class RequestValidationPipe implements PipeTransform {
  private readonly legacy = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => validationFailure(validationIssuesFromClassValidator(errors)),
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
    reason: 'request-validation',
    params: issues === undefined ? {} : { issues },
  });
}

function validationIssuesFromClassValidator(errors: ValidationError[]): ValidationIssue[] {
  return errors.flatMap((error) => {
    const ownIssues = Object.keys(error.constraints ?? {}).map((constraint) => ({
      field: error.property,
      rule: classValidatorRule(constraint),
    }));
    const childIssues = validationIssuesFromClassValidator(error.children ?? []).map((issue) => ({
      ...issue,
      field: `${error.property}.${issue.field}`,
    }));
    return [...ownIssues, ...childIssues];
  });
}

function classValidatorRule(constraint: string): ValidationIssue['rule'] {
  switch (constraint) {
    case 'isDefined':
      return VALIDATION_RULES.REQUIRED;
    case 'isInt':
      return VALIDATION_RULES.INTEGER;
    case 'min':
      return VALIDATION_RULES.MINIMUM;
    case 'max':
      return VALIDATION_RULES.MAXIMUM;
    case 'maxLength':
      return VALIDATION_RULES.MAX_LENGTH;
    case 'isIn':
      return VALIDATION_RULES.INVALID_ENUM;
    case 'whitelistValidation':
      return VALIDATION_RULES.UNKNOWN_FIELD;
    default:
      return VALIDATION_RULES.INVALID_TYPE;
  }
}
