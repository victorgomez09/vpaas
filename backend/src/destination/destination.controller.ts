import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Destination } from '@prisma/client';

import { DestinationService } from './destination.service';

@Controller('destinations')
export class DestinationController {
  constructor(private service: DestinationService) { }

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  async create(@Body() data: Destination) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Destination) {
    return this.service.update(id, data);
  }

  @Put('proxy/:id')
  async updateProxy(@Param('id') id: string, @Body() data: { proxy: boolean }) {
    return this.service.updateProxy(id, data.proxy);
  }

  @Put('proxy/force/:id')
  async updateProxyForce(@Param('id') id: string) {
    return this.service.updateProxyForce(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
