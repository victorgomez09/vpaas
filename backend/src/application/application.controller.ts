import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApplicationService } from './application.service';

@Controller('applications')
export class ApplicationController {
  constructor(private service: ApplicationService) {}

  @Post('configuration/source')
  async configure(
    @Body()
    {
      forPublic,
      gitSourceId,
      type,
      simpleDockerfile,
      destinationId,
    }: {
      gitSourceId?: string | null;
      forPublic?: boolean;
      type?: string;
      simpleDockerfile?: string;
      destinationId: string;
    },
  ) {
    return await this.service.saveApplicationSource({
      forPublic,
      gitSourceId,
      simpleDockerfile,
      type,
      destinationId,
    });
  }

  @Post(':id/configuration/repository')
  async create(@Param('id') id: string, @Body() data: any) {
    return await this.service.create(id, data);
  }
}
