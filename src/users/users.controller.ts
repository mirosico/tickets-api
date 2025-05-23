import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@types';
import { getError } from '@utils';
import {
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  UserProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from './dto';
import { ApiCommonResponses } from '@shared/decorators';
import { ApiAuthResponses } from '@shared/decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'User with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserProfileResponse> {
    try {
      const userId = req.user.id;
      const user = await this.usersService.findOne(userId);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'User with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @Put('profile')
  @ApiCommonResponses()
  @ApiAuthResponses()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateProfileRequest,
  ): Promise<UserProfileResponse> {
    try {
      const userId = req.user.id;
      const user = await this.usersService.update(userId, updateData);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'User with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid current password',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid current password',
        },
      },
    },
  })
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() passwordData: ChangePasswordRequest,
  ): Promise<{ message: string }> {
    try {
      const userId = req.user.id;
      await this.usersService.changePassword(
        userId,
        passwordData.oldPassword,
        passwordData.newPassword,
      );

      return {
        message: 'Password changed successfully',
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
