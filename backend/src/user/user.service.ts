import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserService {
  constructor(private prisma: DatabaseService) {}

  async getById(id: string): Promise<User> {
    return await this.prisma.user.findFirst({ where: { id } });
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { email } });

    delete user.password;
    return user;
  }

  async create(data: User): Promise<User> {
    if (await this.getByEmail(data.email)) {
      throw new Error('Email already exists');
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    const user = await this.prisma.user.create({ data });

    delete user.password;
    return user;
  }

  async update(id: string, data: User): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
