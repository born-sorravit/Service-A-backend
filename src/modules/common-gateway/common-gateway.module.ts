import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ExampleModule } from './example/example.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';

const commonModules = [ExampleModule, UsersModule, WalletModule];

@Module({
  imports: [
    RouterModule.register([
      {
        path: '/common',
        children: commonModules.map((module) => ({
          path: '/',
          module,
        })),
      },
    ]),
    ...commonModules,
  ],
})
export class CommonGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggerMiddleware).forRoutes('common');
  }
}
