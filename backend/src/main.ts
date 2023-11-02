import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'https://4200-victorgomez09-vpaas-azdjnc9ya1a.ws-eu105.gitpod.io',
  });

  await app.listen(3000);
}
bootstrap();
