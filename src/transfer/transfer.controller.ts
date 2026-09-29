import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';

@Controller('transfers')
export class TransferController {
  constructor(private ds: DataSource, private http: HttpService) {}

  @Post('batch')
  async batch(@Body() body: any, @Req() req: any) {
    const accountId = req.user.accountId;
    const results: any[] = [];

    for (const item of body.transfers) {
      if (!item.amount || item.amount <= 0) {
        results.push({ beneficiaryId: item.beneficiaryId, error: 'bad amount' });
        continue;
      }

      const benef = (await this.ds.query(`SELECT * FROM beneficiary WHERE id = '${item.beneficiaryId}'`))[0];
      if (!benef) {
        results.push({ beneficiaryId: item.beneficiaryId, error: 'unknown beneficiary' });
        continue;
      }

      const ops = await this.ds.query(`SELECT amount FROM operation WHERE account_id = '${accountId}'`);
      let balance = 0;
      for (const op of ops) balance += parseFloat(op.amount);

      if (balance < item.amount) {
        results.push({ beneficiaryId: item.beneficiaryId, error: 'insufficient funds' });
        continue;
      }

      await this.ds.query(
        `INSERT INTO operation (account_id, beneficiary_id, amount, label, status) VALUES ('${accountId}', '${benef.id}', ${-item.amount}, '${item.label}', 'PENDING')`,
      );

      try {
        const res = await this.http.axiosRef.post(process.env.PARTNER_URL + '/sepa', {
          iban: benef.iban,
          amount: item.amount * 100,
          label: item.label,
        });
        await this.ds.query(
          `UPDATE operation SET status = 'COMPLETED', partner_ref = '${res.data.id}' WHERE account_id = '${accountId}' AND status = 'PENDING'`,
        );
        results.push({ beneficiaryId: item.beneficiaryId, ok: true, ref: res.data.id });
      } catch (e) {
        console.log(e);
        results.push({ beneficiaryId: item.beneficiaryId, ok: false });
      }
    }

    return results;
  }

  @Get()
  async list(@Req() req: any) {
    const transfers = await this.ds.query(
      `SELECT id, account_id AS "accountId", beneficiary_id AS "beneficiaryId", amount, label, status, partner_ref AS "partnerRef", created_at AS "createdAt" FROM operation WHERE account_id = '${req.user.accountId}' AND beneficiary_id IS NOT NULL ORDER BY created_at DESC`,
    );
    for (const t of transfers) {
      t.beneficiary = (await this.ds.query(`SELECT id, account_id AS "accountId", name, iban, created_at AS "createdAt" FROM beneficiary WHERE id = '${t.beneficiaryId}'`))[0];
    }
    return transfers;
  }
}
