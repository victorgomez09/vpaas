import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Database } from '@prisma/client';

@Controller('databases')
export class DatabaseController {
  constructor(private service: DatabaseService) {}

  @Get()
  getAllDatabases() {
    return this.service.getAllDatabases();
  }

  @Get(':id')
  getDatabaseById(@Param('id') id: string) {
    return this.service.getDatabaseById(id);
  }

  @Get(':id/secrets')
  getDatabaseSecretsById(@Param('id') id: string) {
    return this.service.getDatabaseSecretsById(id);
  }

  @Get(':id/logs')
  getDatabaseLogsById(@Param('id') id: string) {
    return this.service.getDatabaseLogsById(id);
  }

  @Get(':id/status')
  getDatabaseStatusById(@Param('id') id: string) {
    return this.service.getDatabaseStatusById(id);
  }

  @Get('available/list')
  async getAvailableDatabases() {
    return await this.service.getAvailableDatabases();
  }

  @Get('available/:name')
  getAvailableDatabaseByName(@Param('name') name: string) {
    return this.service.getAvailableDatabaseByName(name);
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

  @Post(':id/start')
  startDatabase(@Param('id') id: string) {
    return this.service.startDatabase(id);
  }

  @Post(':id/stop')
  stopDatabase(@Param('id') id: string) {
    return this.service.stopDatabase(id);
  }
}
