import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { getError } from '@utils';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from '@shared/decorators';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { LoginResponseDto } from './dto/responses/login.response.dto';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { RegisterResponseDto } from './dto/responses/register.response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully logged in',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or invalid password',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: ['User with such email not found', 'Invalid password'],
        },
      },
    },
  })
  @ApiCommonResponses()
  async login(@Body() loginData: LoginRequestDto): Promise<LoginResponseDto> {
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
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User with email user@example.com already exists',
        },
      },
    },
  })
  @ApiCommonResponses()
  async register(
    @Body() registerData: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    try {
      const result = await this.authService.register(registerData);
      return result;
    } catch (e) {
      throw getError(e);
    }
  }

  //   @Get('profile')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  //   @ApiOperation({ summary: 'Get user profile' })
  //   @ApiResponse({
  //     status: 200,
  //     description: 'User profile retrieved successfully',
  //     type: ProfileResponseDto,
  //   })
  //   @ApiAuthResponses()
  //   @ApiCommonResponses()
  //   async getProfile(
  //     @Req() req: AuthenticatedRequest,
  //   ): Promise<ProfileResponseDto> {
  //     try {
  //       const userId = req.user.id;
  //       const profile = await this.authService.getProfile(userId);
  //       return profile;
  //     } catch (e) {
  //       throw getError(e);
  //     }
  //   }
}
