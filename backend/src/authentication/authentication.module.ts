import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { jwtConstants } from './constants';
import { AuthenticationGuard } from 'src/guard/authentication.guard';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AuthenticationController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AuthenticationService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
})
export class AuthenticationModule {}
