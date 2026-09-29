import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createAccount, createBeneficiary, createTransfer, credit } from './fixtures';
import { createTestApp, resetDb } from './helpers/test-app';

describe('GET /transfers', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  afterAll(() => app.close());

  beforeEach(() => resetDb(dataSource));

  it('lists the account transfers with their beneficiary', async () => {
    const account = await createAccount(dataSource);
    const beneficiary = await createBeneficiary(dataSource, account, { name: 'Jeanne Dupont' });
    await credit(dataSource, account, 5000);
    await createTransfer(dataSource, account, beneficiary, { amount: -1200 });

    const res = await request(app.getHttpServer()).get('/transfers').set('x-account-id', account.id).expect(200);

    expect(res.body).toEqual([
      {
        id: expect.any(String),
        accountId: account.id,
        beneficiaryId: beneficiary.id,
        amount: -1200,
        label: 'Virement',
        status: 'COMPLETED',
        partnerRef: 'ptr_existing',
        createdAt: expect.any(String),
        beneficiary: {
          id: beneficiary.id,
          accountId: account.id,
          name: 'Jeanne Dupont',
          iban: 'FR7630006000011234567890189',
          createdAt: expect.any(String),
        },
      },
    ]);
  });
});
