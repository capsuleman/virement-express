import './env';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FakeAuthMiddleware } from './auth/fake-auth.middleware';
import { Account } from './entities/account.entity';
import { Beneficiary } from './entities/beneficiary.entity';
import { Operation } from './entities/operation.entity';
import { TransferController } from './transfer/transfer.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Account, Beneficiary, Operation],
      synchronize: true,
    }),
    HttpModule,
  ],
  controllers: [TransferController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FakeAuthMiddleware).forRoutes('*');
  }
}
