import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/config/database/prisma.module';
import { AuthService } from '../services/auth/auth.service';
import { AuthController } from '../controllers/auth/auth.controller';
import { UsersModule } from './users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../constants/auth.constant';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../guards/auth.guard';
import { DockerModule } from './docker.module';
import { ManagerModule } from './manager.module';
import { DatastoreModule } from './datastore.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  imports: [
    PrismaModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    DockerModule,
    ManagerModule,
    DatastoreModule,
  ],
})
export class AuthModule {}
