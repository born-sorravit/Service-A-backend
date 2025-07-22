import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositWalletDto } from './dto/deposit-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { WithdrawWalletMultiDto } from './dto/withdraw-wallet-multi.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/:walletId')
  async getWallet(@Param('walletId') walletId: string) {
    return this.walletService.getWallet(walletId);
  }

  @Post('/deposit/:walletId')
  async deposit(
    @Param('walletId') walletId: string,
    @Body() depositWalletDto: DepositWalletDto,
  ) {
    return this.walletService.deposit(walletId, depositWalletDto);
  }

  @UseGuards(ApiKeyGuard)
  @Post('/withdraw/:walletId')
  async withdraw(
    @Param('walletId') walletId: string,
    @Body() withdrawWalletDto: WithdrawWalletDto,
  ) {
    return this.walletService.withdraw(walletId, withdrawWalletDto);
  }

  @UseGuards(ApiKeyGuard)
  @Post('/withdraw-external/:walletId')
  async withdrawExternal(
    @Param('walletId') walletId: string,
    @Body() withdrawWalletMultiDto: WithdrawWalletMultiDto,
  ) {
    return this.walletService.withdrawExternal(
      walletId,
      withdrawWalletMultiDto,
    );
  }
}
