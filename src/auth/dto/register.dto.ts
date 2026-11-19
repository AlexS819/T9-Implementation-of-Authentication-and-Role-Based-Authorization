import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../users/enums/role.enum';

export class RegisterDto {
  @IsEmail({}, { message: 'Некоректний формат email' })
  @IsNotEmpty({ message: 'Email є обов’язковим' })
  email: string;

  @IsNotEmpty({ message: 'Пароль є обов’язковим' })
  @MinLength(6, { message: 'Пароль повинен містити щонайменше 6 символів' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Некоректна роль' })
  role?: Role;
}
