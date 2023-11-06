import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signin(
    email: string,
    pass: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        password: undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
