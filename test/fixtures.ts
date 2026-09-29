import { DataSource } from 'typeorm';
import { Account } from '../src/entities/account.entity';
import { Beneficiary } from '../src/entities/beneficiary.entity';
import { Operation } from '../src/entities/operation.entity';

export function createAccount(ds: DataSource, overrides: Partial<Account> = {}) {
  return ds.getRepository(Account).save({ name: 'Acme SAS', ...overrides });
}

export function createBeneficiary(ds: DataSource, account: Account, overrides: Partial<Beneficiary> = {}) {
  return ds.getRepository(Beneficiary).save({
    accountId: account.id,
    name: 'Jeanne Dupont',
    iban: 'FR7630006000011234567890189',
    ...overrides,
  });
}

export function credit(ds: DataSource, account: Account, amount: number, overrides: Partial<Operation> = {}) {
  return ds.getRepository(Operation).save({
    accountId: account.id,
    amount,
    label: 'Virement reçu',
    status: 'COMPLETED',
    ...overrides,
  });
}

export function createTransfer(
  ds: DataSource,
  account: Account,
  beneficiary: Beneficiary,
  overrides: Partial<Operation> = {},
) {
  return ds.getRepository(Operation).save({
    accountId: account.id,
    beneficiaryId: beneficiary.id,
    amount: -100,
    label: 'Virement',
    status: 'COMPLETED',
    partnerRef: 'ptr_existing',
    ...overrides,
  });
}
