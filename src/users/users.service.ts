import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });

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
    // Перевіряємо, чи існує користувач з таким email
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email ${data.email} already exists`,
      );
    }

    // Хешуємо пароль
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Створюємо нового користувача
    const user = this.userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
    });

    return this.userRepository.save(user);
  }

  async update(
    id: string,
    data: { name?: string; phone?: string },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Оновлюємо поля
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;

    return this.userRepository.save(user);
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

    // Перевіряємо старий пароль
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new ConflictException('Invalid current password');
    }

    // Хешуємо новий пароль
    user.passwordHash = await bcrypt.hash(newPassword, 10);

    await this.userRepository.save(user);
    return true;
  }
}
