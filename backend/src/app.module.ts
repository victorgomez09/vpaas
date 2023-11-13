import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from './app.service';
import { AuthModule } from './common/modules/auth.module';
import { UsersModule } from './common/modules/users.module';
import { DockerModule } from './common/modules/docker.module';

@Module({
  providers: [AppService],
  imports: [ConfigModule.forRoot(), AuthModule, UsersModule, DockerModule],
})
export class AppModule {}
