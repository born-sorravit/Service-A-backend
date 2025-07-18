import { Controller, Get, Param } from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get('all')
  getAllRates() {
    return this.ratesService.getAllRates();
  }

  @Get('/:currency')
  getRate(@Param('currency') currency: string) {
    return this.ratesService.getRate(currency);
  }
}
