import { Module } from '@nestjs/common';
import { DestinationModule } from './destination/destination.module';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [AppModule, AuthenticationModule, DestinationModule, UserModule],
})
export class AppModule {}
