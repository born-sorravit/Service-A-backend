import { EBankName, EPaymentMethod } from 'src/enums/payment.enums';
import { DefaultBaseEntity } from 'src/shared/database/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('payment')
export class PaymentEntity extends DefaultBaseEntity {
  @Column({
    type: 'enum',
    enum: EPaymentMethod,
    nullable: false,
  })
  method: EPaymentMethod;

  @Column({
    name: 'account_name',
    nullable: true,
  })
  accountName: string;

  @Column({
    name: 'account_number',
    nullable: true,
  })
  accountNumber: string;

  @Column({
    name: 'bank_name',
    type: 'enum',
    enum: EBankName,
    nullable: true,
  })
  bankName: EBankName;

  @Column({
    name: 'additional_info',
    nullable: true,
  })
  additionalInfo: string;

  @Column({
    name: 'img_url',
    nullable: true,
  })
  imgUrl: string; // ใช้สำหรับเก็บ qrCode
}
