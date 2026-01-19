import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthPayload } from './interfaces/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.usersService.createWithHash(
        email,
        passwordHash,
        username,
      );
    } catch (error: any) {
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: { email: string; id: string }) {
    const payload: AuthPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
