import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/setup-app';

export async function createTestApp(): Promise<{ app: INestApplication; dataSource: DataSource }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = setupApp(moduleRef.createNestApplication());
  await app.init();
  return { app, dataSource: app.get(DataSource) };
}

export async function resetDb(dataSource: DataSource) {
  await dataSource.query('TRUNCATE operation, beneficiary, account CASCADE');
}
