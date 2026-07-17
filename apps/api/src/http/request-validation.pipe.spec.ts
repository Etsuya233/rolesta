import type { ArgumentMetadata } from '@nestjs/common';
import { IsInt } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiFailure } from './api-failure.js';
import { RequestValidationPipe } from './request-validation.pipe.js';

class ZodRequestDto extends createZodDto(z.strictObject({ count: z.coerce.number().int() })) {}

class LegacyRequestDto {
  @IsInt()
  count!: number;
}

const metadata = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({
  type: 'body',
  metatype,
});

describe('RequestValidationPipe', () => {
  const pipe = new RequestValidationPipe();

  it('uses Zod metadata for parsing and rejects unknown fields', async () => {
    await expect(pipe.transform({ count: '2' }, metadata(ZodRequestDto))).resolves.toEqual({
      count: 2,
    });
    await expect(
      pipe.transform({ count: 2, extra: true }, metadata(ZodRequestDto)),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      params: { issues: [{ field: 'extra', rule: 'unknownField' }] },
    });
  });

  it('keeps legacy class-validator DTOs on the legacy path', async () => {
    const result = await pipe.transform({ count: 2 }, metadata(LegacyRequestDto));
    expect(result).toBeInstanceOf(LegacyRequestDto);
    await expect(pipe.transform({ count: '2' }, metadata(LegacyRequestDto))).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      params: { issues: [{ field: 'count', rule: 'integer' }] },
      reason: 'request-validation',
    } satisfies Partial<ApiFailure>);
  });
});
