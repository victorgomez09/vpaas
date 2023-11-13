import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [ApplicationService],
  imports: [PrismaModule],
})
export class ApplicationModule {}
