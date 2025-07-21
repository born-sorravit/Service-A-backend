import { Injectable } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { BaseService } from 'src/shared/services/base.service';
import { ApiKeyEntity } from 'src/entities/entities/api-key.entity';
import { ApiKeyRepository } from 'src/entities/entities/api-key.repository';
import { randomBytes } from 'crypto';
import { IResponse } from 'src/shared/interfaces/response.interface';
import { IApiKey } from 'src/interfaces/api-key/api-key.interface';

@Injectable()
export class ApiKeyService extends BaseService {
  constructor(
    // Repositories
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {
    super();
  }
  async generateKey(serviceName: string): Promise<IResponse<IApiKey | null>> {
    try {
      // Check duplicate service name
      const found = await this.apiKeyRepository.findOne({
        where: { serviceName },
      });

      if (found) {
        return this.error('Service name already exists');
      }

      const key = randomBytes(32).toString('hex');
      const newKey = this.apiKeyRepository.create({
        key,
        serviceName,
      });
      await this.apiKeyRepository.save(newKey);

      return this.success({
        id: newKey.id,
        key: newKey.key,
        serviceName: newKey.serviceName,
      });
    } catch (error) {
      return this.error('Failed to generate key', error.message);
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const found = await this.apiKeyRepository.findOne({
        where: { key: apiKey, isActive: true },
      });

      return !!found;
    } catch (error) {
      return false;
    }
  }
}
