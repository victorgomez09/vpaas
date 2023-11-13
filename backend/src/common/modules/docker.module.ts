import { Module } from '@nestjs/common';
import { DockerService } from '../services/docker/docker.service';

@Module({
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}
