import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DestinationModule } from './destination/destination.module';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabaseModule } from './database/database.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ServiceModule } from './services/service.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SchedulerModule,
    AppModule,
    AuthenticationModule,
    DestinationModule,
    UserModule,
    DatabaseModule,
    ServiceModule,
  ],
})
export class AppModule {}
