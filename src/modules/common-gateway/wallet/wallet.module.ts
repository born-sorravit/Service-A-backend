import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { RatesModule } from '../rates/rates.module';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
  imports: [RatesModule, ApiKeyModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
