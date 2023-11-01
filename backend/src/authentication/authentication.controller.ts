import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';

import { AuthenticationService } from './authentication.service';
import { Public } from 'src/decorator/public.decorator';

@Controller('auth')
export class AuthenticationController {
  constructor(private service: AuthenticationService) {}

  @Public()
  @Post('signin')
  async signin(
    @Body() data: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.signin(data.email, data.password);

    res.cookie('access_token', result.token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    res.json({
      token: result.token,
      user: result.user,
    });
  }
}
