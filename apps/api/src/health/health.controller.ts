import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeOkResponse } from '../openapi/api-envelope-response.decorator.js';
import { HealthService, type HealthResponse } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  @ApiEnvelopeOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'service'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['rolesta-api'] },
      },
    },
  })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
