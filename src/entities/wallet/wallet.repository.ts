import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WalletEntity } from './wallet.entity';
import { ECurrency } from 'src/enums/currency.enums';

@Injectable()
export class WalletRepository extends Repository<WalletEntity> {
  constructor(private dataSource: DataSource) {
    super(WalletEntity, dataSource.createEntityManager()); // The second argument is the EntityManager, which can be injected if needed
  }

  async createWithTransaction(
    transactionEntityManager: EntityManager,
  ): Promise<WalletEntity | null> {
    const wallet = transactionEntityManager.create(WalletEntity, {
      balance: '0',
      currency: ECurrency.USD,
    });
    return await transactionEntityManager.save(wallet);
  }
}
