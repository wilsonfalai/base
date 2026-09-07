import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { Public } from '../auth/public.decorator.js';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getLiveness() {
    return { status: 'ok' as const };
  }

  @Get('ready')
  getReadiness() {
    return this.healthService.checkReadiness();
  }
}
