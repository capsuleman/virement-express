import { INestApplication } from '@nestjs/common';

export function setupApp(app: INestApplication) {
  app.enableShutdownHooks();
  return app;
}
