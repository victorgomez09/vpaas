import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { rmSync } from 'fs';

import { AppModule } from './app.module';
import { executeCommand } from './utils/command.util';

const isDev = process.env.NODE_ENV !== 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [
      // 'http://localhost:4200',
      'https://4200-victorgomez09-vpaas-azdjnc9ya1a.ws-eu106.gitpod.io',
    ],
  });

  try {
    console.log(`[001] Initializing server...`);
    await executeCommand(`docker network create --attachable vpaas`);
  } catch (error) {
    // Ignore
  }

  try {
    console.log(
      '[003] Cleaning up old build sources under /tmp/build-sources/...',
    );
    if (!isDev) rmSync('/tmp/build-sources', { recursive: true, force: true });
  } catch (error) {
    console.log(error);
  }

  await app.listen(3000);
}

bootstrap();
