import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Service } from '@prisma/client';

@Controller('services')
export class ServiceController {
  constructor(private service: ServiceService) {}

  @Get('available')
  getAvailableServices() {
    return this.service.getAvailableServices();
  }

  @Get('list')
  getAll() {
    return this.service.getAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get(':id/status')
  getStatusById(@Param('id') id: string) {
    return this.service.getServiceStatus(id);
  }

  @Post('create')
  create(@Body() data: Service) {
    return this.service.create(data);
  }
}
