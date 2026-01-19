import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // Used for OpenApi docs mostly, here we use structure
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // We manually validate here for simplicity or use LocalStrategy.
    // Spec says POST /auth/login returns token.
    // Let's manually validate for directness similar to standard JWT flows without LocalStrategy overhead if not needed,
    // OR use LocalStrategy if preferred. Spec didn't specify strategy, just endpoints.
    // Manual validation typically:
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new Error('Invalid credentials'); // Ideally HttpException
    }
    return this.authService.login(user); // returns access_token: string
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
