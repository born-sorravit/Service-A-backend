import { DataSource, Repository } from 'typeorm';
import { RateEntity } from './Rate.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RateRepository extends Repository<RateEntity> {
  constructor(private dataSource: DataSource) {
    super(RateEntity, dataSource.createEntityManager());
  }
}
