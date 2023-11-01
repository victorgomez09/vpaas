import { Module } from '@nestjs/common';

import { DestinationController } from './destination.controller';
import { DestinationService } from './destination.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [DestinationController],
  providers: [DestinationService],
  imports: [DatabaseModule],
})
export class DestinationModule {}
