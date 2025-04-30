import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${data.email} already exists`,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepository.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
    });
  }

  async update(
    id: string,
    data: { name?: string; phone?: string },
  ): Promise<User> {
    return this.userRepository.updateUser(id, data);
  }

  async findUserWithOrders(id: string): Promise<User> {
    const user = await this.userRepository.findUserWithOrders(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findUserWithCarts(id: string): Promise<User> {
    const user = await this.userRepository.findUserWithCarts(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new ConflictException('Invalid current password');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.saveWrite(user);
    return true;
  }
}
