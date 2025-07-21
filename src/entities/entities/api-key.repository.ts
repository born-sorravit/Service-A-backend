import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ApiKeyEntity } from './api-key.entity';

@Injectable()
export class ApiKeyRepository extends Repository<ApiKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(ApiKeyEntity, dataSource.createEntityManager());
  }
}
