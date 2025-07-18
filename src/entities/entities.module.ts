import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExampleRepository } from './example/example.repository';
import { ExampleEntity } from './example/example.entity';
import { UserEntity } from './users/user.entity';
import { UserRepository } from './users/user.repository';
import { WalletEntity } from './wallet/wallet.entity';
import { WalletRepository } from './wallet/wallet.repository';
import { RateEntity } from './rate/rate.entity';
import { RateRepository } from './rate/rate.repository';
import { PaymentEntity } from './payment/payment.entity';
import { PaymentRepository } from './payment/payment.repository';

const Entitys = [
  ExampleEntity,
  UserEntity,
  WalletEntity,
  RateEntity,
  PaymentEntity,
];
const Repositorys = [
  ExampleRepository,
  UserRepository,
  WalletRepository,
  RateRepository,
  PaymentRepository,
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([...Entitys])],
  providers: [...Repositorys],
  exports: [...Repositorys],
})
export class EntitiesModule {}
