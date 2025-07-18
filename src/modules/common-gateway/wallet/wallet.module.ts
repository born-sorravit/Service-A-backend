import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [RatesModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
