import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Database } from '@prisma/client';
import { Response } from 'express';
import { DatabaseService } from './database.service';

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

  @Get(':id/backup')
  async buffer(@Param('id') id: string, @Res() response: Response) {
    const file = await this.service.createDatabaseBackup(id, 'buffer');
    response.header('Content-Type', 'application/octet-stream');
    response.header(
      'Content-Disposition',
      `attachment; filename=${file.fileName}`,
    );
    response.send(file);
  }

  @Get(':id/usage')
  getDatabaseUsageById(@Param('id') id: string) {
    return this.service.getDatabaseUsageById(id);
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

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteDatabase(id);
  }
}
