import { DefaultBaseEntity } from 'src/shared/database/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { WalletEntity } from '../wallet/wallet.entity';

@Entity('users')
export class UserEntity extends DefaultBaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @OneToOne(() => WalletEntity, { cascade: true })
  @JoinColumn({ name: 'wallet' })
  wallet: WalletEntity;
}
