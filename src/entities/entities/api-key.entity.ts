import { DefaultBaseEntity } from 'src/shared/database/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('api_keys')
export class ApiKeyEntity extends DefaultBaseEntity {
  @Column({ unique: true })
  key: string;

  @Column()
  serviceName: string;

  @Column({ default: true })
  isActive: boolean;
}
