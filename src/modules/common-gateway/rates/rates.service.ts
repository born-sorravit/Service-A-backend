import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/shared/services/base.service';
import { RateRepository } from 'src/entities/rate/rate.repository';
import { RateEntity } from 'src/entities/rate/Rate.entity';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Injectable()
export class RatesService extends BaseService {
  constructor(
    // Repositories
    private readonly rateRepository: RateRepository,
  ) {
    super();
  }

  async getRate(currency: string): Promise<IResponse<RateEntity> | null> {
    try {
      const rate = await this.rateRepository
        .createQueryBuilder('rate')
        .select(['rate.id', 'rate.currency', 'rate.rateToUSD'])
        .where('rate.currency = :currency', {
          currency: currency.toLocaleUpperCase(),
        })
        .getOne();

      if (!rate) {
        return this.error(`Rate ${currency} not found`, 404);
      }

      return this.success(rate);
    } catch (error) {
      return this.error(`Failed to get rate ${currency}`, error.message);
    }
  }

  async getAllRates() {
    try {
      const rates = await this.rateRepository
        .createQueryBuilder('rate')
        .select(['rate.id', 'rate.currency', 'rate.rateToUSD'])
        .getMany();

      if (!rates) {
        return this.error('Rates not found');
      }

      return this.success(rates);
    } catch (error) {
      return this.error('Failed to get all rates', error.message);
    }
  }
}
