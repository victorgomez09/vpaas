import { Module } from '@nestjs/common';

import { DestinationController } from './destination.controller';
import { DestinationService } from './destination.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [DestinationController],
  providers: [DestinationService],
  imports: [PrismaModule],
})
export class DestinationModule {}
