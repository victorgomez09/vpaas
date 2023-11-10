import { Body, Controller, Get, Post } from '@nestjs/common';
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

  @Post('create')
  create(@Body() data: Service) {
    return this.service.create(data);
  }
}
