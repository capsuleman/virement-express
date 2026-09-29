import 'reflect-metadata';
import '../src/env';
import { DataSource } from 'typeorm';
import { Account } from '../src/entities/account.entity';
import { Beneficiary } from '../src/entities/beneficiary.entity';
import { Operation } from '../src/entities/operation.entity';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Account, Beneficiary, Operation],
  synchronize: true,
});

function daysAgo(days: number, hour = 10, minute = 0) {
  const date = new Date(Date.now() - days * 86_400_000);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000);
}

async function account(name: string, createdAt = daysAgo(120)): Promise<string> {
  const [row] = await ds.query('INSERT INTO account (name, created_at) VALUES ($1, $2) RETURNING id', [name, createdAt]);
  return row.id;
}

async function beneficiary(accountId: string, name: string, iban: string, createdAt = daysAgo(90)): Promise<string> {
  const [row] = await ds.query(
    'INSERT INTO beneficiary (account_id, name, iban, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
    [accountId, name, iban, createdAt],
  );
  return row.id;
}

async function operation(
  accountId: string,
  beneficiaryId: string | null,
  amount: number,
  label: string,
  createdAt: Date,
  status = 'COMPLETED',
) {
  const partnerRef = beneficiaryId && status === 'COMPLETED' ? `ptr_${Math.random().toString(36).slice(2, 10)}` : null;
  await ds.query(
    'INSERT INTO operation (account_id, beneficiary_id, amount, label, status, partner_ref, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [accountId, beneficiaryId, amount, label, status, partnerRef, createdAt],
  );
}

async function seed() {
  await ds.initialize();
  await ds.query('TRUNCATE operation, beneficiary, account CASCADE');

  const martin = await account('Boulangerie Martin');
  await operation(martin, null, 40000, 'Encaissements CB', daysAgo(40));
  await operation(martin, null, 20000, 'Encaissements CB', daysAgo(10));
  const employees = ['Léa Moreau', 'Hugo Petit', 'Chloé Lambert', 'Nathan Roux', 'Inès Fournier'];
  for (const [i, name] of employees.entries()) {
    const id = await beneficiary(martin, name, `FR76300060000112345678900${10 + i}`);
    await operation(martin, id, -2400, 'Salaire', daysAgo(35, 9, i));
    await operation(martin, id, -2500, 'Salaire', daysAgo(2, 9, i));
  }
  const minoterie = await beneficiary(martin, 'Minoterie Dubois', 'FR7630004000031234567890143');
  await operation(martin, minoterie, -1830.4, 'Facture farine', daysAgo(12));
  await operation(martin, minoterie, -1245.9, 'Facture farine', daysAgo(5));
  await operation(martin, minoterie, -980, 'Facture farine', daysAgo(1), 'FAILED');
  const edf = await beneficiary(martin, 'EDF Entreprises', 'FR7630003000401234567890178');
  await operation(martin, edf, -312.57, 'Électricité', daysAgo(20));
  const edfFournil = await beneficiary(martin, 'EDF Entreprises', 'FR7630003000401234567890199');
  await operation(martin, edfFournil, -198.4, 'Électricité fournil', daysAgo(8));

  const kappa = await account('Studio Kappa');
  await operation(kappa, null, 8000, 'Paiement client', daysAgo(20));
  const loueur = await beneficiary(kappa, 'Loc Matériel Pro', 'FR7610107001011234567890129', daysAgo(60));
  await operation(kappa, loueur, -1500, 'Location caméra', daysAgo(15));
  const paul = await beneficiary(kappa, 'Paul Girard (freelance)', 'FR7612548029981234567890161', daysAgo(60));
  await operation(kappa, paul, -2200, 'Montage vidéo', daysAgo(6));
  await operation(kappa, paul, -900, 'Montage vidéo', daysAgo(3), 'FAILED');
  await operation(kappa, paul, -400, 'Acompte', hoursAgo(1), 'PENDING');
  await beneficiary(kappa, 'Nouveau Fournisseur SARL', 'FR7614508000301234567890147', hoursAgo(2));

  const leroy = await account('Cabinet Leroy');
  await operation(leroy, null, 15000, 'Honoraires', daysAgo(28));
  const leroyPayments: [string, number][] = [
    ['Papeterie Centrale', -800],
    ['Cabinet Expertise', -1200],
    ['Nettoyage Pro', -650],
    ['Loyer SCI Leroy', -2100],
  ];
  for (const [i, [name, amount]] of leroyPayments.entries()) {
    const id = await beneficiary(leroy, name, `FR76175150000812345678901${20 + i}`);
    await operation(leroy, id, amount, name, daysAgo(6 - i));
  }

  const nova = await account('Nova Conseil');
  await operation(nova, null, 30000, 'Levée de fonds', daysAgo(25));
  const agence = await beneficiary(nova, 'Agence Immo Bastille', 'FR7630056009991234567890111');
  await operation(nova, agence, -15000, 'Dépôt de garantie', daysAgo(4));
  await operation(nova, agence, -500, "Frais d'agence", daysAgo(3));
  const graphik = await beneficiary(nova, 'Studio Graphik', 'FR7630004000039876543210155');
  await operation(nova, graphik, -1200, 'Identité visuelle', daysAgo(2));
  await operation(nova, graphik, -800, 'Site web', daysAgo(1));

  await account('Atelier Nomade', daysAgo(3));

  const accounts: { id: string; name: string }[] = await ds.query('SELECT id, name FROM account ORDER BY name');
  console.log('Seed OK. Comptes (header x-account-id) :');
  for (const a of accounts) console.log(`  ${a.name.padEnd(20)} ${a.id}`);
  await ds.destroy();
}

seed();
