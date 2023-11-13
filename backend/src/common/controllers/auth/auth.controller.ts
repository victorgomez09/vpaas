import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Login } from 'src/common/dtos/auth.dto';
import { AuthService } from 'src/common/services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Login) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }
}
