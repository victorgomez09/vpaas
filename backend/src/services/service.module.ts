import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService],
  imports: [PrismaModule],
  exports: [ServiceService],
})
export class ServiceModule {}
