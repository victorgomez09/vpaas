import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

@Module({
  controllers: [DatabaseController],
  providers: [DatabaseService],
  imports: [PrismaModule],
})
export class DatabaseModule {}
