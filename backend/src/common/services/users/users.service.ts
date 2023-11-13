import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    try {
      return this.prisma.user.findFirst({
        where: {
          email,
        },
      });
    } catch (error) {
      console.log('error', error);
    }
  }

  async create(data: User) {
    try {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(data.password, salt);

      return this.prisma.user.create({
        data: {
          ...data,
          password: password,
        },
        select: {
          id: true,
          email: true,
          name: true,
          lastName: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.log('error', error);
    }
  }
}
