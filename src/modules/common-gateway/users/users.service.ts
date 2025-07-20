import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { UserRepository } from 'src/entities/users/user.repository';
import { BaseService } from 'src/shared/services/base.service';
import { decryptPassword } from 'src/utils/decryptPassword';
import { encryptPassword } from 'src/utils/hashPassword';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/entities/users/user.entity';
import { WalletRepository } from 'src/entities/wallet/wallet.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService extends BaseService {
  private readonly passwordSecret: string;
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    // Repositories
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,

    // Services
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.passwordSecret = configService.get('passwordSecret');
  }
  async register(createUserDto: CreateUserDto) {
    try {
      const userExists = await this.userRepository.findOne({
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      });

      if (userExists) {
        return this.error('User already exists', 409);
      }

      return await this.manager.transaction(
        async (transactionEntityManager) => {
          // Create wallet
          const wallet = await this.walletRepository.createWithTransaction(
            transactionEntityManager,
          );

          // Create user
          const newUser = {
            name: createUserDto.name,
            email: createUserDto.email,
            username: createUserDto.username,
            password: createUserDto.password,
            wallet: wallet,
          };

          const user = await transactionEntityManager.create(
            UserEntity,
            newUser,
          );

          await transactionEntityManager.save(UserEntity, user);

          return this.success({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            wallet: {
              balance: wallet.balance,
              currency: wallet.currency,
            },
          });
        },
      );
    } catch (error) {
      return this.error('Failed to create user', error.message);
    }
  }

  async login(username: string, password: string) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.wallet', 'wallet')
        .where('LOWER(user.username) = LOWER(:username)', {
          username: username,
        })
        .getOne();

      if (!user) {
        return this.error('User not found', 404);
      }

      const isPasswordValidFromDB = await decryptPassword(
        user.password,
        this.passwordSecret,
        user.username,
      );

      const isPasswordValidFromClient = await decryptPassword(
        password,
        this.passwordSecret,
        user.username,
      );
      console.log({ 1: user.username, 2: username });

      if (
        user.username !== username ||
        isPasswordValidFromDB !== isPasswordValidFromClient
      ) {
        return this.error('Invalid username or password');
      }

      // ✅ สร้าง JWT Token
      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      const accessToken = this.jwtService.sign(payload);

      return this.success({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        wallet: {
          id: user.wallet.id,
          balance: user.wallet.balance,
          currency: user.wallet.currency,
        },
        accessToken,
      });
    } catch (error) {
      return this.error('Login failed', error.message);
    }
  }
}
