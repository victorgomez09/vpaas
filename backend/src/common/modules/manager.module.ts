import { Module } from '@nestjs/common';
import { ManagerService } from '../services/manager/manager.service';
import { DockerModule } from './docker.module';

@Module({
  imports: [DockerModule],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
