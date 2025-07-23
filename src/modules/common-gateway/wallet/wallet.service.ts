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
import { WithdrawWalletMultiDto } from './dto/withdraw-wallet-multi.dto';
import { WalletEntity } from 'src/entities/wallet/wallet.entity';
import { UserEntity } from 'src/entities/users/user.entity';

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

  async getWallet(walletId: string) {
    try {
      const wallet = await this.walletRepository
        .createQueryBuilder('wallet')
        .select(['wallet.id', 'wallet.balance', 'wallet.currency'])
        .where('wallet.id = :id', { id: walletId })
        .getOne();

      if (!wallet) {
        return this.error('Wallet not found');
      }

      return this.success(wallet);
    } catch (error) {
      return this.error('Failed to get wallet', error.message);
    }
  }

  async deposit(
    walletId: string,
    depositWalletDto: DepositWalletDto,
    transactionEntityManager?: EntityManager,
  ) {
    try {
      const manager = transactionEntityManager || this.walletRepository.manager;

      const wallet = await manager.findOne(WalletEntity, {
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
        rate = await this.ratesService.getRate(ECurrency.USD);
        newAmount = depositWalletDto.amount.toString();
      }

      const newBalance = new BigNumber(wallet.balance)
        .plus(newAmount)
        .toFixed(2)
        .toString();

      wallet.balance = newBalance;

      await manager.save(WalletEntity, wallet);

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
      return await this.manager.transaction(
        async (transactionEntityManager) => {
          const fromWallet = await transactionEntityManager.findOne(
            WalletEntity,
            {
              where: { id: walletId },
            },
          );

          if (!fromWallet) {
            throw new Error('Wallet not found');
          }

          const recipientUser = await transactionEntityManager
            .createQueryBuilder(UserEntity, 'user')
            .innerJoinAndSelect('user.wallet', 'wallet')
            .where('(user.username) = (:username)', {
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
            rate = await this.ratesService.getRate(ECurrency.USD);
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
          await this.deposit(
            recipientUser.wallet.id,
            {
              amount: withdrawWalletDto.amount,
              currency: withdrawWalletDto.currency,
            },
            transactionEntityManager,
          );

          await transactionEntityManager.save(WalletEntity, fromWallet);
          return this.success({
            id: fromWallet.id,
            withdrawnAmount: Number(newAmount),
            withdrawnCurrency: withdrawWalletDto.currency,
            rateToUSD: Number(rate.data.rateToUSD),
            totalBalance: Number(newBalance),
            currencyBalance: fromWallet.currency,
          });
        },
      );
    } catch (error) {
      return this.error(`Failed to withdraw ${error.message}`);
    }
  }

  async withdrawExternal(
    walletId: string,
    withdrawWalletMultiDto: WithdrawWalletMultiDto,
  ) {
    try {
      return await this.manager.transaction(
        async (transactionEntityManager) => {
          const fromWallet = await transactionEntityManager.findOne(
            WalletEntity,
            {
              where: { id: walletId },
            },
          );

          if (!fromWallet) {
            throw new Error('Wallet not found');
          }

          const toUsersDto = withdrawWalletMultiDto.toUsers;
          const usernames = toUsersDto.map((u) => u.username);

          const recipientUsers = await transactionEntityManager
            .createQueryBuilder(UserEntity, 'user')
            .innerJoinAndSelect('user.wallet', 'wallet')
            .where('(user.username) IN (:...usernames)', { usernames })
            .getMany();

          if (recipientUsers.length !== usernames.length) {
            throw new Error('Some recipient users not found');
          }

          const recipientMap = new Map(
            recipientUsers.map((user) => [user.username.toLowerCase(), user]),
          );

          let totalWithdrawnUSD = new BigNumber(0);
          const withdrawalResults = [];

          for (const u of toUsersDto) {
            const recipient = recipientMap.get(u.username.toLowerCase());
            if (!recipient) continue;

            const rateResponse = await this.ratesService.getRate(u.currency);
            const rateToUSD = new BigNumber(rateResponse.data.rateToUSD);
            const amountInUSD =
              u.currency === ECurrency.USD
                ? new BigNumber(u.amount)
                : new BigNumber(u.amount).dividedBy(rateToUSD);

            if (new BigNumber(fromWallet.balance).isLessThan(amountInUSD)) {
              throw new Error(
                `Insufficient balance to send to ${u.username} (${u.amount} ${u.currency})`,
              );
            }

            // Withdraw จากผู้ส่ง
            fromWallet.balance = new BigNumber(fromWallet.balance)
              .minus(amountInUSD)
              .toFixed(2);

            // ใช้ transactionEntityManager สำหรับ deposit
            await this.deposit(
              recipient.wallet.id,
              {
                amount: u.amount,
                currency: u.currency,
              },
              transactionEntityManager,
            );

            totalWithdrawnUSD = totalWithdrawnUSD.plus(amountInUSD);

            withdrawalResults.push({
              to: u.username,
              amount: Number(u.amount),
              currency: u.currency,
              amountInUSD: Number(amountInUSD.toFixed(2)),
              rateToUSD: Number(rateToUSD.toFixed(4)),
            });
          }

          await transactionEntityManager.save(WalletEntity, fromWallet);

          return this.success({
            id: fromWallet.id,
            totalWithdrawnUSD: Number(totalWithdrawnUSD.toFixed(2)),
            totalBalance: Number(fromWallet.balance),
            currencyBalance: fromWallet.currency,
            transactions: withdrawalResults,
          });
        },
      );
    } catch (error) {
      return this.error(`Failed to withdraw ${error.message}`);
    }
  }
}
