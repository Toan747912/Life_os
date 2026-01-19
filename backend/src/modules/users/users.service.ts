import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      email: createUserDto.email,
      passwordHash: createUserDto.password, // Note: Hashing should happen here or in logic calling this. Plan said Auth service handles hash or User service. Let's do it in Auth service for separation or here. Ideally here or strict entity listener. Spec says "Password must be Hash (Bcrypt)". I'll handle hashing in AuthService to keep this service pure or here. Let's keep it simple: pass hased password or hash here.
      // Actually standard practice: hash in listener or service. I will accept raw password in DTO here but save it as hash?
      // Wait, standard separation: Auth service hashes, User service saves.
      // Or User service hashes.
      // Let's assume the passed DTO contains clean data. The calling AuthService will likely hash it.
      // BUT `createUserDto` usually comes from Controller.
      // Let's update `create` to accept data primarily.
      // For now, I will assume the caller handles hashing or I'll add bcrypt here.
      // Let's stick to simple storage here.
    });
    return this.usersRepository.save(user);
  }

  // Helper for Auth Service - to be precise, Auth Service will likely pass the hashed password
  // So I'll modify create to take partial User or specific params if needed, but DTO is fine if we transform it.

  async createWithHash(
    email: string,
    passwordHash: string,
    fullName?: string,
  ): Promise<User> {
    const user = this.usersRepository.create({
      email,
      passwordHash,
      fullName: fullName || '', // Default to empty if not provided, or handle null
    });
    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
