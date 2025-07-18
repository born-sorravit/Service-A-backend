import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { BaseService } from 'src/shared/services/base.service';
import { PaymentRepository } from 'src/entities/payment/payment.repository';

@Injectable()
export class PaymentsService extends BaseService {
  constructor(
    // Repositories
    private readonly paymentRepository: PaymentRepository,
  ) {
    super();
  }

  async findAll() {
    try {
      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select([
          'payment.id',
          'payment.method',
          'payment.accountName',
          'payment.accountNumber',
          'payment.bankName',
          'payment.additional_info',
          'payment.imgUrl',
        ])
        .getMany();
      return this.success(payments);
    } catch (error) {
      return this.error('Failed to retrieve payments', error.message);
    }
  }

  async findOne(id: string) {
    try {
      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select([
          'payment.id',
          'payment.method',
          'payment.accountName',
          'payment.accountNumber',
          'payment.bankName',
          'payment.additionalInfo',
          'payment.imgUrl',
        ])
        .where('payment.id = :id', { id })
        .getOne();

      if (!payments) {
        return this.error('Payment not found', 404);
      }
      return this.success(payments);
    } catch (error) {
      return this.error('Failed to retrieve payment', error.message);
    }
  }
}
