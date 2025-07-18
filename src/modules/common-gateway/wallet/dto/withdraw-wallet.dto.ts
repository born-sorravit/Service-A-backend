import { PartialType } from '@nestjs/mapped-types';
import { CreateWalletDto } from './create-wallet.dto';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ECurrency } from 'src/enums/currency.enums';

export class WithdrawWalletDto extends PartialType(CreateWalletDto) {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount must have at most 2 decimal places' },
  )
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsEnum(ECurrency)
  @IsNotEmpty()
  currency: ECurrency;

  @IsString()
  @IsNotEmpty()
  toUsername: string;
}
