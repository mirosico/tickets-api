import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getError } from '@utils';
import { LoginRequest, RegisterRequest } from './types';
import { AuthenticatedRequest } from '@types';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginRequest })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterRequest })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '81667441-b913-44ab-a9d2-73f80785dfef',
            },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
          },
        },
        token: {
          type: 'string',
          example: '81667441-b913-44ab-a9d2-73f80785dfef',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
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
