import { Module } from '@nestjs/common';
import { UsersController } from '../controllers/users/users.controller';
import { UsersService } from '../services/users/users.service';
import { PrismaModule } from 'src/config/database/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}
