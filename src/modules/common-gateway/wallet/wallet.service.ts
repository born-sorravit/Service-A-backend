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

@Injectable()
export class WalletService extends BaseService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    // Repositories
    private readonly walletRepository: WalletRepository, // Services
    private readonly userRepository: UserRepository,
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

      if (depositWalletDto.currency !== ECurrency.USD) {
        // TODO : เพิ่มเงินเป็นสกุลเงินอื่นๆ
      } else {
        wallet.balance = new BigNumber(wallet.balance)
          .plus(depositWalletDto.amount)
          .toString();
      }

      await this.walletRepository.save(wallet);
      return this.success({
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
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

      // Check balance ก่อนจะทำการ withdraw
      const checkBalance = new BigNumber(fromWallet.balance).isLessThan(
        withdrawWalletDto.amount,
      );

      if (checkBalance) {
        return this.error('Insufficient balance');
      }

      if (withdrawWalletDto.currency !== ECurrency.USD) {
        // TODO : ถอนเงินเป็นสกุลเงินอื่นๆ
      } else {
        // Withdraw จากผู้ส่ง
        fromWallet.balance = new BigNumber(fromWallet.balance)
          .minus(withdrawWalletDto.amount)
          .toString();

        // Deposit ให้กับผู้รับ
        await this.deposit(recipientUser.wallet.id, {
          amount: withdrawWalletDto.amount,
          currency: withdrawWalletDto.currency,
        });

        await this.walletRepository.save(fromWallet);
      }
    } catch (error) {
      return this.error('Failed to withdraw', error.message);
    }
  }
}
