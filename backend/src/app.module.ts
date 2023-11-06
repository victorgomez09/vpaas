import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DestinationModule } from './destination/destination.module';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    AppModule,
    AuthenticationModule,
    DestinationModule,
    UserModule,
    DatabaseModule,
    ConfigModule.forRoot(),
  ],
})
export class AppModule {}
