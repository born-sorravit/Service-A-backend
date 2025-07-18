import { ECurrency } from 'src/enums/currency.enums';
import { DefaultBaseEntity } from 'src/shared/database/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('rate')
export class RateEntity extends DefaultBaseEntity {
  @Column({
    name: 'rate_to_usd',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
  })
  rateToUSD: string;

  @Column({
    name: 'currency',
    nullable: false,
    type: 'enum',
    enum: ECurrency,
    default: ECurrency.USD,
  })
  currency: ECurrency;
}
