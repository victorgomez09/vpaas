import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from 'src/prisma/prisma.module';
import { SchedulerService } from './scheduler.service';

@Module({
  controllers: [],
  providers: [SchedulerService],
  imports: [HttpModule, ScheduleModule.forRoot(), PrismaModule],
  exports: [],
})
export class SchedulerModule {}
