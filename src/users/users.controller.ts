import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../shared/types';
import { getError } from '../shared/utils';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
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

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: { name?: string; phone?: string },
  ) {
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

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    try {
      const userId = req.user.id;
      await this.usersService.changePassword(
        userId,
        passwordData.oldPassword,
        passwordData.newPassword,
      );

      return {
        message: 'Пароль успішно змінено',
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
