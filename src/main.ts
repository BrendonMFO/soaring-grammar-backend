import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ApiConfigService } from '@core/api-config/services/api-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableVersioning();
  const apiConfigService = app.get(ApiConfigService);
  await app.listen(apiConfigService.apiConfig.port);
}

bootstrap();
