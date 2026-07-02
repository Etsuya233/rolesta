import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { API_SUCCESS_CODE } from '@rolesta/shared';

type ApiEnvelopeResponseOptions = {
  description?: string;
} & (
  | {
      schema: Record<string, unknown>;
      type?: never;
    }
  | {
      schema?: never;
      type: Type<unknown>;
    }
);

export function ApiEnvelopeOkResponse(options: ApiEnvelopeResponseOptions) {
  const schema = createEnvelopeSchema(options);
  const decorators = [
    ApiOkResponse(
      options.description === undefined
        ? { schema }
        : {
            description: options.description,
            schema,
          },
    ),
  ];

  if (options.type) {
    decorators.unshift(ApiExtraModels(options.type));
  }

  return applyDecorators(...decorators);
}

function createEnvelopeSchema(options: ApiEnvelopeResponseOptions): Record<string, unknown> {
  const dataSchema = 'schema' in options ? options.schema : { $ref: getSchemaPath(options.type) };

  return {
    type: 'object',
    required: ['code', 'msg', 'data'],
    properties: {
      code: { type: 'string', enum: [API_SUCCESS_CODE], example: API_SUCCESS_CODE },
      msg: { type: 'string', example: 'ok' },
      data: dataSchema,
    },
  };
}
