import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // Optional: Add fullName implementation if desired, but not strictly in spec for auth
  // fullName?: string;
}
