import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { User } from '@prisma/client';

import { UserService } from './user.service';
import { Public } from 'src/decorator/public.decorator';

@Controller('users')
export class UserController {
  constructor(private service: UserService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('email/:email')
  getByEmail(@Param('email') email: string) {
    return this.service.getByEmail(email);
  }

  @Post('getMe')
  getMe(@Req() req: Request) {
    try {
      return this.service.getByEmail(req['user'].subject);
    } catch (error) {
      console.log('error', error);
    }
  }

  @Public()
  @Post()
  create(@Body() data: User) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: User) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
