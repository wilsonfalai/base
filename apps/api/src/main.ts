import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Environment } from './config/environment.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Environment, true>);
  app.enableShutdownHooks();
  await app.listen(configService.get('PORT', { infer: true }), '0.0.0.0');
}
await bootstrap();
