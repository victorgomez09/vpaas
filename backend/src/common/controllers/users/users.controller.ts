import { Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '@prisma/client';

import { Public } from 'src/common/guards/public.guard';
import { UsersService } from 'src/common/services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('/email/:email')
  async findByEmail(@Param('email') email: string) {
    return await this.service.findByEmail(email);
  }

  @Public()
  @Post('/create')
  async create(data: User) {
    return await this.service.create(data);
  }
}
