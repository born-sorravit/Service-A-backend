import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mySecretKey', // ควรเก็บใน env
      signOptions: { expiresIn: '1h' }, // หรือ '15m' เป็นต้น
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
