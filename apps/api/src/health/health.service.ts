import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: 'rolesta-api';
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'rolesta-api',
    };
  }
}
