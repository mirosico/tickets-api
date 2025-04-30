import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@users/entities/user.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class AuthRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.createReadQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    const user = this.create(data);
    return this.saveWrite(user);
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.updateWrite({ id: userId }, { passwordHash });
  }
}
