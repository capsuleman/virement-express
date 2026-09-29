import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { Beneficiary } from './beneficiary.entity';

export type OperationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

@Entity('operation')
export class Operation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'beneficiary_id', type: 'uuid', nullable: true })
  beneficiaryId: string | null;

  @ManyToOne(() => Beneficiary, { nullable: true })
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary | null;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @Column({ type: 'varchar' })
  status: OperationStatus;

  @Column({ name: 'partner_ref', type: 'varchar', nullable: true })
  partnerRef: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
