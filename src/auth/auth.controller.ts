import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getError } from '@utils';
import { LoginRequest, RegisterRequest } from './types';
import { AuthenticatedRequest } from '@types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: LoginRequest) {
    try {
      const result = await this.authService.login(
        loginData.email,
        loginData.password,
      );
      return result;
    } catch (e) {
      throw getError(e);
    }
  }

  @Post('register')
  async register(@Body() registerData: RegisterRequest) {
    try {
      const result = await this.authService.register(registerData);
      return result;
    } catch (e) {
      throw getError(e);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const profile = await this.authService.getProfile(userId);
      return profile;
    } catch (e) {
      throw getError(e);
    }
  }
}
