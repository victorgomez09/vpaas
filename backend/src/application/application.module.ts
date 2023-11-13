import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApplicationController } from './application.controller';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [PrismaModule],
})
export class ApplicationModule {}
