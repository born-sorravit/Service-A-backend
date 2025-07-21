import { Controller, Post, Body } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Controller('api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  async createKey(@Body('serviceName') serviceName: string) {
    return this.apiKeyService.generateKey(serviceName);
  }
}
