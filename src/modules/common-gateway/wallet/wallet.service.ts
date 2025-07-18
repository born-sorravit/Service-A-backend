import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { WalletRepository } from 'src/entities/wallet/wallet.repository';
import { BaseService } from 'src/shared/services/base.service';
import { ECurrency } from 'src/enums/currency.enums';
import { BigNumber } from 'bignumber.js';
import { DepositWalletDto } from './dto/deposit-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';
import { UserRepository } from 'src/entities/users/user.repository';
import { RatesService } from '../rates/rates.service';
import { IRate } from 'src/interfaces/rates/rates.interface';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { RateEntity } from 'src/entities/rate/Rate.entity';

@Injectable()
export class WalletService extends BaseService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    // Repositories
    private readonly walletRepository: WalletRepository,
    private readonly userRepository: UserRepository,

    // Services
    private readonly ratesService: RatesService,
  ) {
    super();
  }

  async deposit(walletId: string, depositWalletDto: DepositWalletDto) {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { id: walletId },
      });

      if (!wallet) {
        return this.error('Wallet not found');
      }
      let newAmount: string;
      let rate: IResponse<RateEntity>;
      if (depositWalletDto.currency !== ECurrency.USD) {
        rate = await this.ratesService.getRate(depositWalletDto.currency);
        newAmount = new BigNumber(depositWalletDto.amount)
          .dividedBy(rate.data.rateToUSD)
          .toFixed(2)
          .toString();
      } else {
        newAmount = depositWalletDto.amount.toString();
      }

      const newBalance = new BigNumber(wallet.balance)
        .plus(newAmount)
        .toFixed(2)
        .toString();

      wallet.balance = newBalance;
      await this.walletRepository.save(wallet);
      return this.success({
        id: wallet.id,
        depositAmount: Number(newAmount),
        depositCurrency: depositWalletDto.currency,
        rateToUSD: Number(rate.data.rateToUSD),
        totalBalance: Number(newBalance),
        currencyBalance: wallet.currency,
      });
    } catch (error) {
      return this.error('Failed to deposit', error.message);
    }
  }

  async withdraw(walletId: string, withdrawWalletDto: WithdrawWalletDto) {
    try {
      const fromWallet = await this.walletRepository.findOne({
        where: { id: walletId },
      });

      if (!fromWallet) {
        return this.error('Wallet not found');
      }

      const recipientUser = await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.wallet', 'wallet')
        .where('LOWER(user.username) = LOWER(:username)', {
          username: withdrawWalletDto.toUsername,
        })
        .getOne();

      if (!recipientUser) {
        return this.error('Recipient user not found');
      }

      let newAmount: string;
      let rate: IResponse<RateEntity>;
      if (withdrawWalletDto.currency !== ECurrency.USD) {
        rate = await this.ratesService.getRate(withdrawWalletDto.currency);
        newAmount = new BigNumber(withdrawWalletDto.amount)
          .dividedBy(rate.data.rateToUSD)
          .toFixed(2)
          .toString();
      } else {
        newAmount = withdrawWalletDto.amount.toString();
      }

      // Check balance ก่อนจะทำการ withdraw
      const checkBalance = new BigNumber(fromWallet.balance).isLessThan(
        newAmount,
      );

      if (checkBalance) {
        return this.error('Insufficient balance');
      }

      // Withdraw จากผู้ส่ง
      const newBalance = new BigNumber(fromWallet.balance)
        .minus(newAmount)
        .toFixed(2)
        .toString();
      fromWallet.balance = newBalance;

      // Deposit ให้กับผู้รับ
      await this.deposit(recipientUser.wallet.id, {
        amount: withdrawWalletDto.amount,
        currency: withdrawWalletDto.currency,
      });

      await this.walletRepository.save(fromWallet);

      return this.success({
        id: fromWallet.id,
        withdrawnAmount: Number(newAmount),
        withdrawnCurrency: withdrawWalletDto.currency,
        rateToUSD: Number(rate.data.rateToUSD),
        totalBalance: Number(newBalance),
        currencyBalance: fromWallet.currency,
      });
    } catch (error) {
      return this.error('Failed to withdraw', error.message);
    }
  }
}
