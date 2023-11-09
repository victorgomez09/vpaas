import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [],
  providers: [],
  imports: [HttpModule, ScheduleModule.forRoot(), PrismaModule],
  exports: [],
})
export class SchedulerModule {}
