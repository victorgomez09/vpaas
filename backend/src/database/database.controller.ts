import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Database } from '@prisma/client';

@Controller('databases')
export class DatabaseController {
  constructor(private service: DatabaseService) {}

  @Get('available')
  getAvailableDatabases() {
    return this.service.getAvailableDatabases();
  }

  @Get('available/:name/version/:version')
  getDatabaseImage(
    @Param('name') name: string,
    @Param('version') version: string,
  ) {
    return this.service.getDatabaseImage(name, version);
  }

  @Post()
  create(@Body() data: Database) {
    return this.service.create(data);
  }
}
