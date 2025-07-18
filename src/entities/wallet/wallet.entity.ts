import { ECurrency } from 'src/enums/currency.enums';
import { DefaultBaseEntity } from 'src/shared/database/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('wallet')
export class WalletEntity extends DefaultBaseEntity {
  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
  })
  balance: string;

  @Column({
    name: 'currency',
    nullable: false,
    type: 'enum',
    enum: ECurrency,
    default: ECurrency.USD,
  })
  currency: ECurrency;
}
